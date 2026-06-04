/** Function declarations for gemini, and mappings to `World` methods */

import { Interactions } from '@google/genai';
import { World } from './world.ts';
import assert from 'node:assert';

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
    args: { [index: string]: { type: string; description: string } },
    returnType: 'object' | 'array' = 'object'
): Interactions.Function {
    const declaration: Interactions.Function = {
        type: 'function',
        name,
        description,
        parameters: {
            type: returnType,
            required: Object.keys(args),
            ...args,
        },
    };
    functions.push(declaration);
    return declaration;
}

createDeclaration(
    'moveStep',
    'Moves the specified number of steps (where a step is ~10cm) in the current yzDir.\
    Returns the new position & rotation state.',
    {
        steps: {
            type: 'number',
            description:
                'Light level from 0 to 100. Zero is off and 100 is full brightness',
        },
    }
);

createDeclaration(
    'setRotateHoriz',
    'Sets the direction of the robot, relative to the yz plane, in degrees, in [0, 360),\
    where 0 is facing the positive y direction, and positive directions go anticlockwise.\
    Returns the new state.',
    {
        degrees: {
            type: 'number',
            description:
                'The direction relative to the yz plane, in degrees, in the interval [0, 360).',
        },
    }
);

createDeclaration(
    'setRotateVert',
    'Sets the vertical agnle of the sensors, relative to the xy plane, in degrees, in [-50, 50],\
    where 0 is parallel with the xy plane, and positive directions face toward the\
    positive z direction. Returns the new state.',
    {
        degrees: {
            type: 'number',
            description:
                'The rotation relative to the xy plane, in degrees, in the interval [-50, 50].',
        },
    }
);

createDeclaration(
    'setZ',
    'Sets the height of the robot, between 0.5 and 1.5m. This does not affect sensor angles. Returns the new state.',
    {
        z: {
            type: 'number',
            description: 'The new height, in the interval [0.5, 1.5]',
        },
    }
);

createDeclaration(
    'getSensorData',
    'Returns the data in an array from the sensors. Each item of the array is a number\
    that is the distance from the sensor to the nearest object (this may be Infinity if\
    the sensor can see infinitely far with no obstructions). There is one sensor.',
    {},
    'array'
);

export function executeCall(
    world: World,
    call: Interactions.FunctionCallStep
): object {
    assert(typeof call.name === 'string');
    // @ts-expect-error typescript doesn't know that call.name: string
    const func = world[call.name]?.bind(world); // eslint-disable-line

    assert(typeof func === 'function');
    assert(typeof call.arguments === 'object');

    const result = func(call.arguments); // eslint-disable-line

    return typeof result === 'object' ? (result as object) : world.getState();
}
