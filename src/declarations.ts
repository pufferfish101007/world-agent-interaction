/** Function declarations for gemini, and mappings to `World` methods */

import { type Interactions } from '@google/genai';
import { World } from './world.ts';
import assert from 'node:assert';
import * as zod from 'zod';

// Function declarations are added to this when `createDeclaration` is called
export const functions: Array<Interactions.Function> = [];

/**
 * Declares a function that gemini can use. All arguments will be required.
 * @param name - must correspond to a method in `World`
 * @param description - must be clear and concise
 * @param args - descriptions should be clear and concise
 * @param returnType - the return type. Should be 'object' or 'array'
 * @returns the function declaration
 */
function createDeclaration(
    name: string,
    description: string,
    args: zod.z.core.JSONSchema.JSONSchema,
): Interactions.Function {
    const declaration: Interactions.Function = {
        type: 'function',
        name,
        description,
        parameters: {
            type: 'object',
            properties: args,
            required: Object.keys(args),
        },
    };
    if (Object.keys(args).length === 0) {
        // @ts-expect-error aaa
        delete declaration.parameters.properties;
        // @ts-expect-error aaa
        delete declaration.parameters.required;
    }
    functions.push(declaration);
    return declaration;
}

createDeclaration(
    'moveSteps',
    'Moves the specified number of steps (where a step is 1m) in the current xzDir. \
    Returns the new position & rotation state.',
    {
        steps: {
            type: 'number',
            description:
                'The number of metres to move (does not have to be an integer!)',
        },
    }
);

createDeclaration(
    'setRotateHoriz',
    'Sets the direction of the robot, relative to the xz plane, in degrees, in [0, 360), \
    where 0 is facing the positive x direction, and positive directions go anticlockwise. \
    Returns the new state.',
    {
        degrees: {
            type: 'number',
            minimum: 0,
            maximum: 360,
            description:
                'The direction relative to the yz plane, in degrees, in the interval [0, 360).',
        },
    }
);

createDeclaration(
    'setRotateVert',
    'Sets the vertical agnle of the sensors, relative to the xy plane, in degrees, in [-50, 50], \
    where 0 is parallel with the xy plane, and positive directions face toward the \
    positive z direction. Returns the new state.',
    {
        degrees: {
            type: 'number',
            minimum: -50,
            maximum: 50,
            description:
                'The rotation relative to the xy plane, in degrees, in the interval [-50, 50].',
        },
    }
);

createDeclaration(
    'setZ',
    'Sets the height of the robot, between 0.5 and 1.5m. This does not affect sensor angles. \
    Returns the new state.',
    {
        z: {
            type: 'number',
            minimum: 0.5,
            maximum: 1.5,
            description: 'The new height, in the interval [0.5, 1.5]',
        },
    }
);

createDeclaration(
    'getState',
    'Gets the position and rotation state, as described in the system instructions.',
    {}
);

createDeclaration(
    'getSensorData',
    'Returns the data in an array from the sensors. Each item of the array is a number \
    that is the distance from the sensor to the nearest object (this may be Infinity if \
    the sensor can see infinitely far with no obstructions). There is one sensor.',
    {},
);

export function executeCall(
    world: World,
    call: Interactions.FunctionCallStep
): object {
    assert(typeof call.name === 'string');
    const func = (
        world as unknown as {
            [index: string]: (_: object) => object | undefined;
        }
    )[call.name]?.bind(world);

    assert(typeof func === 'function');
    assert(typeof call.arguments === 'object');

    console.log('calling', func.name, 'with arguments', call.arguments);

    const result = func(call.arguments);

    console.log(JSON.stringify(result));

    return typeof result === 'object' ? result : world.getState();
}
