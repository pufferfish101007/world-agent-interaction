/**
 * Defines the state of the agent's world.
 *
 * The world is communicated to the agent via a grid of sensors that determine
 * the agent's distance to the nearest object from that sensor. The sensors
 * send out beams of light parallel to each other and record the distance.
 * (Think LIDAR).
 */

import { clamp, degreesToRadians } from './util.js';

export class World {
    x: number = 0;
    y: number = 0;

    /**
     * z (height), in range [0.5, 1.5].
     *
     * Can be thought of as being in metres, but all units are arbitrary
     * so it doesn't really matter.
     */
    z: number = 1;

    /** The rotation relative to the y-z plane (i.e. left-right)
     * in degrees, in the range [0, 360)
     *
     * To match up with the standard unit circle (sort of), we define the
     * directions to be:
     * 0  -> parallel to the y-z plane, facing the positive end of the y axis
     * 90 -> perpendicular to the y-z plane, facing the negative end of the
     *       x axis
     */
    yzDir: number = 0;

    /** The rotation relative to the x-y plane (i.e. up-down) in degrees,
     * in the range [-50, 50]. Limited angle because a restricted range of
     * motion seems sensible and also means we don't need to worry about
     * turning upside down if we were to go over the top, or even just vertical.
     *
     * 0 degrees is parallel to the x-y plane; negative angles look below the
     * x-y plane (towards negative z values), and positive angles look above the
     * x-y plane
     */
    xyRot: number = 0;

    moveSteps({ steps }: { steps: number }) {
        this.y += steps * Math.cos(degreesToRadians(this.yzDir));
        this.x += steps * Math.sin(degreesToRadians(this.yzDir));

        // TODO: check for collisions with objects/boundaries
    }

    rotateHoriz({ degrees }: { degrees: number }) {
        this.setRotateHoriz({ degrees: this.yzDir + degrees });
    }

    setRotateHoriz({ degrees }: { degrees: number }) {
        this.yzDir = degrees % 360;
    }

    rotateVert({ degrees }: { degrees: number }) {
        this.setRotateVert({ degrees: this.xyRot + degrees });
    }

    setRotateVert({ degrees }: { degrees: number }) {
        this.xyRot = clamp(-50, 50, degrees);
    }

    setZ({ z }: { z: number }) {
        this.z = clamp(0.5, 1.5, z);
    }

    /**
     * Gets the sensor data. Currently just 1 sensor to simplify things.
     */
    getSensorData(): Array<number> {
        // TODO: actually sense objects in the world. At the moment this just returns
        // the distance to the floor.
        return [
            this.xyRot >= 0
                ? Infinity
                : Math.sin(degreesToRadians(-this.xyRot)) * this.z,
        ];
    }

    getState(): object {
        return {
            x: this.x,
            y: this.y,
            z: this.z,
            xyRot: this.xyRot,
            yzDir: this.yzDir,
        };
    }
}
