import { GoogleGenAI, type Interactions } from '@google/genai';
import { loadEnvFile, env } from 'node:process';
import {
    executeCall,
    functions as functionDeclarations,
} from './declarations.ts';
import { World } from './world.ts';
import * as zod from 'zod';
import type { MaybeSingleArr } from './util.ts';
import type { Task } from './tasks.ts';

loadEnvFile();

const system_instruction = `
# Context

You are an autonomous robot exploring a room. You can freely rotate and move in
the direction that you are facing. You have a sensor which sends out a beam of
light in a straight line and calculates the distance to the nearest object.
The sensor will be facing the way you face, but you can also tilt the sensor
up or down by up to 50 degrees. You can also raise or lower the sensor to be at
a height between 0.5 and 1.5m above the ground.

You will be given a particular task to complete, which will require you to
output some numbers in the format of the specified json schema.

# Available tools

You have several function call tools available to use; their descriptions should be
sufficient to explain how to use them.

Units: all distances are in metres, and all angles are
in degrees.

Unless otherwise specified, all functions will return the current state:
x, y and z positions, along with \`xyRot\`, the vertical tilt relative to the xy plane,
and \`yzDir\`, the angle you are facing (relative to the yz plane).

\`getSensorData\` returns an array of data from the sensor; this is a singleton array
as there is only one sensor. The data in each element of the array is a number in metres.

You may also, and should, use the code execution tool to do any calculations that you need.
You are likely to need to use some trigonometry, and possibly some vector arithmetic.
Use whatever libraries are available and appropriate.

# Expected behaviour

You should complete the task using the most appropriate relevant function tool calls
and code execution.
Return a result only when you have used sufficiently many function calls and done enough
calculation in order to be confident of your answer, or if you seem to be stuck and
cannot make progress, in which case you should return a best guess best on the information
you have, and nothing else (e.g. don't use 'typical expected values').
The result MUST be formatted according to the requested JSON schema.

# Strategies

You will need to call getSensorData after changing position and/or rotation,
as just moving or rotating will not give you any information other than that your current position.
You should not try to establish boundaries within the world by simply moving towards the boundary
until you reach it; you should prefer to utilise sensor data from rotating on the spot, although
moving is very much permitted if it allows you to see features of the room that you would otherwise
not be able to.

You will need to utilise rotation to gather data; simply moving in a straight line will not
gather any additional information. If you find yourself repeating the same action over and
over again, just return your best guess answer rather than getting stuck in that loop.
If at any point, a function returns some unexpected result that doesn't match your expectations
and/or the tool schema, terminate the process and explain that that is the reason your have
terminated. Otherwise, your final output must match the requested json schema.

If the sensor data returns Infinity at any point, it means that you have clipped through
the walls; backtrack by using negative steps to get back in the room.

Once you have a result for one aspect of the task (e.g. a size of a particular object in a
certain dimension), you can assume that that result is correct, and there is no need check
or re-evaluate it; focus then on the remaining goals. Once each part of the task has been
completed, return the result according to the requested JSON schema.

If you are unsure about the coordinate system or units, refer to the function call declarations,
which clearly define the coordinate and rotation system. The origin lies at the centre of the room.

# Important constraints

You should make function calls in parallel wherever possible and appropriate,
to save on requests.

You should use code execution whenever appropriate to do nontrivial calculations.
`;

type InteractionInput =
    | MaybeSingleArr<Interactions.Content>
    | Array<Interactions.Step>;

export class Agent extends GoogleGenAI {
    static MODEL: string = env['MODEL']!;

    #previousInteractionId: string | undefined;

    #interactions: number = 0;

    constructor() {
        super({});

        return this;
    }

    async #interact(
        input: InteractionInput,
        responseSchema: zod.z.core.JSONSchema.JSONSchema | undefined = undefined
    ): Promise<{
        output_text: string | undefined;
        steps: Array<Interactions.Step>;
    }> {
        const interaction = await this.interactions.create({
            model: Agent.MODEL,
            input,
            tools: [{ type: 'code_execution' }, ...functionDeclarations],
            previous_interaction_id: this.#previousInteractionId!,
            system_instruction,
            generation_config: {
                thinking_summaries: 'auto',
                thinking_level: 'low',
                temperature: 0.6,
            },
        });

        if (typeof responseSchema === 'object') {
            interaction.response_format = {
                type: 'text',
                mime_type: 'application/json',
                schema: responseSchema,
            };
        }

        this.#previousInteractionId = interaction.id;

        this.#interactions++;

        return {
            output_text: interaction.output_text,
            steps: interaction.steps,
        };
    }

    async execute_task(task: Task): Promise<object> {
        let response_received: object | null = null;
        let { output_text, steps } = await this.#interact(
            {
                type: 'text',
                text: task.instructions,
            },
            task.jsonSchema
        );

        // @ts-expect-error tricky to type properly
        const world: World = new task.World() as World;

        const input_queue: Array<InteractionInput> = [];
        $interaction_loop: while (response_received === null) {
            const new_input: Array<Interactions.Step> = [];
            for (const step of steps) {
                switch (step.type) {
                    case 'thought': {
                        if (step.summary) {
                            for (const contentBlock of step.summary) {
                                if (contentBlock.type === 'text')
                                    console.log(contentBlock.text);
                            }
                        }
                        break;
                    }
                    case 'model_output': {
                        console.log(output_text);
                        response_received = task.schema.parse(
                            JSON.parse(output_text!)
                        ) as object;
                        break $interaction_loop;
                    }
                    case 'function_call': {
                        const result = executeCall(world, step);
                        new_input.push({
                            type: 'function_result',
                            name: step.name,
                            call_id: step.id,
                            result: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(result),
                                },
                            ],
                        });
                        break;
                    }
                    case 'code_execution_call': {
                        console.log('executing code');
                        break;
                    }
                    case 'code_execution_result': {
                        console.log('got code execution result');
                        break;
                    }
                    default: {
                        throw new Error(`unexpected step type "${step.type}"`);
                    }
                }
            }
            input_queue.push(new_input);
            if (input_queue.length === 0) {
                throw new Error(
                    'exhausted input queue without getting a finished response'
                );
            }
            console.log(
                input_queue.length,
                'remaining interactions queued,',
                this.#interactions,
                'interactions used'
            );
            const input = input_queue.shift()!;
            const response = await this.#interact(input, task.jsonSchema);
            output_text = response.output_text;
            steps = response.steps;
        }
        if (input_queue.length > 0)
            console.warn(
                'got finished output with more interactions still queued'
            );
        return response_received;
    }
}
