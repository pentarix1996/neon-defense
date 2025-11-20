/**
 * 2D Vector Utility Class.
 * Essential for handling physics, positions, and movement vectors.
 */
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /** Adds another vector to this one. */
    add(v) { return new Vector(this.x + v.x, this.y + v.y); }

    /** Subtracts another vector from this one. */
    sub(v) { return new Vector(this.x - v.x, this.y - v.y); }

    /** Multiplies the vector by a scalar. */
    mult(n) { return new Vector(this.x * n, this.y * n); }

    /** Calculates the magnitude (length) of the vector. */
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }

    /** Returns a normalized version of the vector (unit vector). */
    norm() {
        const m = this.mag();
        return (m > 0) ? this.mult(1 / m) : new Vector(0, 0);
    }

    /** Calculates the Euclidean distance to another vector. */
    dist(v) {
        return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
    }

    /**
     * Calculates the shortest distance from a point (p3) to a line segment defined by p1 and p2.
     * Used for Railgun collision detection.
     * @param {Vector} p1 - Line start point
     * @param {Vector} p2 - Line end point
     * @param {Vector} p3 - Point to measure distance from
     */
    static distanceToLine(p1, p2, p3) {
        const numerator = Math.abs((p2.y - p1.y) * p3.x - (p2.x - p1.x) * p3.y + p2.x * p1.y - p2.y * p1.x);
        const denominator = Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));
        return numerator / denominator;
    }
}