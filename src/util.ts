export function degreesToRadians(degrees: number): number {
    return (Math.PI * degrees) / 180;
}

export function clamp(min: number, max: number, x: number): number {
    return Math.max(min, Math.min(max, x));
}

export type MaybeSingleArr<T> = T | T[];

export class Vec3 {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    scale(k: number): Vec3 {
        return new Vec3(this.x * k, this.y * k, this.z * k);
    }

    add(b: Vec3): Vec3 {
        return new Vec3(this.x + b.x, this.y + b.y, this.z + b.z);
    }

    sub(b: Vec3): Vec3 {
        return this.add(b.scale(-1));
    }

    dot(b: Vec3): number {
        return this.x * b.x + this.y * b.y + this.z * b.z;
    }

    length(): number {
        return Math.sqrt(this.dot(this));
    }

    cross(b: Vec3): Vec3 {
        return new Vec3(
            this.y * b.z - this.z * b.y,
            this.z * b.x - this.x * b.z,
            this.x * b.y - this.y * b.x
        );
    }
}

/**
 * A line is a vector that might be offset from the origin.
 *
 * L = k d + a for all lambda in R
 */
export class Line {
    d: Vec3;
    a: Vec3;

    constructor(d: Vec3, a: Vec3) {
        this.d = d;
        this.a = a;
    }
}

/**
 * A plane is a 2-dimensional subspace of R^3, offset from the origin, so we
 * represent it using two basis vectors, plus a constant vector to provide the offset.
 *
 * P = lambda b1 + mu b2 + c, for all lambda, mu in R
 *
 * TODO: allow providing bounds to planes?
 */
export class Plane {
    b1: Vec3;
    b2: Vec3;
    c: Vec3;

    // normal to the plane
    n: Vec3;

    constructor(b1: Vec3, b2: Vec3, c: Vec3) {
        this.b1 = b1;
        this.b2 = b2;
        this.c = c;

        this.n = this.b1.cross(this.b2);
    }

    /**
     * Finds the intersection point between this plane P and the line L. If
     * there is no intersection point (i.e. they are parallel), then the result
     * is infinite in all dimensions. The result is a vector representing a
     * position relative to the origin.
     */
    intersection(L: Line): Vec3 {
        // Cartesian equation of P is n.x x + n.y y + n.z z = n dot c
        // So n.x (a.x + k d.x) + n.y (a.y + k d.y) + n.z (a.z + k d.z) = n dot c
        // k (n.x d.x + n.y d.y + n.z d.z) = n dot c - n.x a.x - n.y a.y - n.z a.z
        // k = (n dot c - n dot a)) / (n dot d)  (note that this will be Infinity if d perp n)
        // Then the point of intersection is a + k d
        console.log(this.n, this.c, this.n.dot(this.c));
        const k = (this.n.dot(this.c) - this.n.dot(L.a)) / this.n.dot(L.d);
        if (k < 0) return new Vec3(Infinity, Infinity, Infinity);
        return L.d.scale(k).add(L.a);
    }
}
