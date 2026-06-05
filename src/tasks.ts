import * as zod from 'zod';
import type { World } from './world.ts';
import * as measure_room_simple from './tasks/measure_room_simple.ts';
import * as measure_room_harder from './tasks/measure_room_harder.ts';

type TaskModule = {
    instructions: string;
    jsonSchema: zod.z.core.JSONSchema.JSONSchema;
    World: World;
};

export type Task = {
    name: string;
    instructions: string;
    jsonSchema: zod.z.core.JSONSchema.JSONSchema;
    schema: zod.ZodType;
    World: World;
};

function compileTask(name: string, taskModule: TaskModule): Task {
    return {
        name,
        instructions: taskModule.instructions,
        schema: zod.fromJSONSchema(taskModule.jsonSchema),
        jsonSchema: taskModule.jsonSchema,
        World: taskModule.World,
    };
}

export const tasks: { [index: string]: Task } = {
    measure_room_simple: compileTask(
        'measure_room_simple',
        measure_room_simple as unknown as TaskModule
    ),
    measure_room_harder: compileTask(
        'measure_room_harder',
        measure_room_harder as unknown as TaskModule
    ),
};
