/** Measure the dimensions of an empty, closed, cuboid room (cuboidal?) */

import * as zod from 'zod';
import { World as BaseWorld } from '../world.ts';
import { degreesToRadians, Line, Plane, Vec3 } from '../util.ts';

export const jsonSchema: zod.z.core.JSONSchema.JSONSchema = {
    type: 'object',
    properties: {
        width: {
            type: 'number',
            description: 'The width of the room, in metres',
        },
        depth: {
            type: 'number',
            description: 'The depth of the room, in metres',
        },
        height: {
            type: 'number',
            description: 'The height of the room, in metres.',
        },
    },
    required: ['width', 'depth', 'height'],
};

export const instructions = `Measure the dimensions of the room, using the available functions.
Do not return a response until you have moved enough and gathered enough sensor data to get the
correct answer. You should return the width, depth, and height of the room; it doesn't matter which
way round the width and depth are. All dimensions should be in the same unit given by the sensors
(i.e. metres). You may assume that the room is an empty cuboid. If at any point the sensor data
is zero or infinite, you have reached or stepped outside of the boundaries of the room, and you
should backtrack to get back inside of the room. Do not simply guess by assuming common room
dimensions. Do not collect redundant data; once you have calculated a dimension you should
not try to check it unless it directly conflicts with other calculations.

You may assume that you are initially placed facing one of the walls, in the centre of the room.

To measure height, you will need to use some trigonometry, but you may also need to move
to ensure that your sensor senses the floor and not a wall, depending on the angle;
but this may not be necessary. Use reasoning or calculation to determine what is necessqary.

Be aware that when trying to measure the distance to the ceiling, you might clip the wall instead.
Because of this, you should aim to use steep vertical angles (up to 50 degrees) to measure the
ceiling height. You can also move closer to a wall, and measure away from that wall to give
more room to avoid clipping the opposite wall.`;

export class World extends BaseWorld {
    static WIDTH = 15;
    static DEPTH = 9;
    static HEIGHT = 3;

    static PLANES = [
        new Plane(new Vec3(1, 0, 0), new Vec3(0, 1, 0), new Vec3(0, 0, 0)),
        new Plane(new Vec3(1, 0, 0), new Vec3(0, 1, 0), new Vec3(0, 0, 3)),
        new Plane(new Vec3(0, 0, 1), new Vec3(0, 1, 0), new Vec3(-4.5, 0, 0)),
        new Plane(new Vec3(0, 0, 1), new Vec3(0, 1, 0), new Vec3(4.5, 0, 0)),
        new Plane(new Vec3(1, 0, 0), new Vec3(0, 0, 1), new Vec3(0, -7.5, 0)),
        new Plane(new Vec3(1, 0, 0), new Vec3(0, 0, 1), new Vec3(0, 7.5, 0)),
    ];

    constructor() {
        super();
    }

    // TODO: stop agent from walking through walls

    override getSensorData(): Array<number> {
        // We want to figure out: which of the following planes does the line of sight intersect
        // first, if any? (in an ideal world it should always cross a plane, but currently the agent
        // can walk through walls).
        // z = 0 (floor)
        // z = 3 (ceiling)
        // x = -7.5
        // x = 7.5
        // y = -4.5
        // y = 4.5
        // A simple way to do it would be to just find the distances to all of the planes, and find
        // the minimum.
        const pos = new Vec3(this.x, this.y, this.z);
        const view = new Line(
            new Vec3(
                Math.sin(degreesToRadians(this.yzDir)),
                Math.cos(degreesToRadians(this.yzDir)),
                Math.tan(degreesToRadians(this.xyRot))
            ),
            pos
        );
        console.log(this.getState(), pos, view);
        const distances = World.PLANES.map((plane) =>
            plane.intersection(view).sub(pos).length()
        ).map((num) => (Number.isNaN(num) ? Infinity : num));
        console.log(distances);
        return [Math.min(...distances)];
    }
}
