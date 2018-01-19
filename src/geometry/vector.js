import * as _ from 'lodash';
import * as utils from '../utils';
import Vertex from './vertex';

// Will be loaded at the bottom to prevent circular dependency
let Circle;

class Vector {
  get vertex1() {
    return this._vertex1;
  }

  set vertex1(vertex) {
    return this._vertex1 = new Vertex(vertex);
  }

  get vertex2() {
    return this._vertex2;
  }

  set vertex2(vertex) {
    return this._vertex2 = new Vertex(vertex);
  }

  get x1() {
    return this.vertex1.x;
  }

  get y1() {
    return this.vertex1.y;
  }

  get x2() {
    return this.vertex2.x;
  }

  get y2() {
    return this.vertex2.y;
  }

  constructor(vertex1, vertex2, { rotationProduct } = {}) {
    this.vertex1 = vertex1;
    this.vertex2 = vertex2;
    this.rotationProduct = rotationProduct;
  }

  // Gets the length of the vector based on its vertices
  getLength() {
    return Math.sqrt((this.x1 - this.x2) ** 2 + (this.y1 - this.y2) ** 2);
  }

  // Gets the slope gradient of the vector (m)
  getSlope(axis) {
    if (!axis) {
      return (this.y2 - this.y1) / (this.x2 - this.x1);
    }

    return Math.tan(this.getAngle(axis));
  }

  // Gets the slope degree of the vector in radians (m)
  // If an axis was provided then the slope will be calculated relatively to that axis
  getAngle(axis) {
    if (!axis) {
      return Math.atan(this.getSlope());
    }

    // http://stackoverflow.com/questions/1878907/the-smallest-difference-between-2-angles
    const a1 = this.getAngle();
    const a2 = axis.getAngle();

    return Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1));
  }

  getVertices() {
    return [this._vertex1, this._vertex2];
  }

  getCenter() {
    return new Vertex(
      this.x1 + this.x2 / 2,
      this.y1 + this.y2 / 2
    );
  }

  // Returns if line has given vertex
  hasVertex({ x, y }) {
    if (!this.boundsHaveVertex(x, y)) return false;
    return (y - this.y1) / (x - this.x1) == this.getSlope();
  }

  // Returns if given vertex is contained by the bounds aka cage of line
  boundsHaveVertex({ x, y }) {
    return utils.isBetween(x, this.x1, this.x2) &&
      utils.isBetween(y, this.y1, this.y2);
  }

  getIntersection(shape) {
    if (shape instanceof Vector)
      return this.getVectorIntersection(shape);
    if (shape instanceof Circle)
      return this.getCircleIntersection(shape);
  }

  // Gets intersection vertex with given vector
  getVectorIntersection(vector) {
    // Escape if vectors are parallel
    if (!(((this.x1 - this.x2) * (vector.y1 - vector.y2)) - ((this.y1 - this.y2) *
        (vector.x1 - vector.x2)))) {
      return Vertex.NaN;
    }

    // Intersection vertex formula
    // https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
    const x = ((((this.x1 * this.y2) - (this.y1 * this.x2)) * (vector.x1 - vector.x2)) -
      ((this.x1 - this.x2) * ((vector.x1 * vector.y2) - (vector.y1 * vector.x2)))) /
      (((this.x1 - this.x2) * (vector.y1 - vector.y2)) - ((this.y1 - this.y2) * (
      vector.x1 - vector.x2)));
    const y = ((((this.x1 * this.y2) - (this.y1 * this.x2)) * (vector.y1 - vector.y2)) -
      ((this.y1 - this.y2) * ((vector.x1 * vector.y2) - (vector.y1 * vector.x2)))) /
      (((this.x1 - this.x2) * (vector.y1 - vector.y2)) - ((this.y1 - this.y2) * (
      vector.x1 - vector.x2)));

    if (utils.isBetween(x, this.x1, this.x2) && utils.isBetween(x, vector.x1, vector.x2) &&
        utils.isBetween(y, this.y1, this.y2) && utils.isBetween(y, vector.y1, vector.y2)) {
      return new Vertex({ x, y });
    }

    return Vertex.NaN;
  }

  getCircleIntersection(circle) {
    return circle.getVectorIntersection(this);
  }

  // Makes sure that vector's length is at least at the length of the provided minimum
  // relatively to the given pivot, else a new vector will be returned who's length
  // is minimum
  normalizeLength(min, pivot = this.vertex1) {
    if (!min) return this;

    // The length of the extension, if required at all
    const length = min - this.getLength();

    // If the current length is bigger than the minimum provided, no extension is needed
    if (length < 0) return this;

    // Determine the counter pivot, the vertex which does not equal to the current pivot
    const vertices = [this.vertex1, this.vertex2];
    const counterIndex = vertices.findIndex(vertex => !_.isEqual(vertex, pivot));

    if (counterIndex == -1) return this;

    const index = (counterIndex + 1) % 2
    const counterPivot = vertices[counterIndex];

    // Determine whether we should extend the vector backwards or forwards
    // Note that the coordinate system in canvas is actually mirrored, therefore we need
    // to calculate a special factor for each dimension
    const xFactor = (counterPivot.x - pivot.x) / Math.abs(counterPivot.x - pivot.x) || 0;
    const yFactor = (counterPivot.y - pivot.y) / Math.abs(counterPivot.y - pivot.y) || 0;

    const angle = this.getAngle();

    const vertex = {
      x: pivot.x + xFactor * length * Math.abs(Math.cos(angle)),
      y: pivot.y + yFactor * length * Math.abs(Math.sin(angle))
    };

    // Note that the order of the vertices might be critical, depends on the calculation
    const normalizedVertices = [];
    normalizedVertices[index] = pivot;
    normalizedVertices[counterIndex] = vertex;

    return new Vector(...normalizedVertices);
  }

  // Finds the angles between the two vectors based on the law of cosines
  // If both vectors are completely aligned with each other, NaN will be returned
  // https://en.wikipedia.org/wiki/Law_of_cosines
  cosines(vector) {
    const diff = _.chain([this, vector])
      .map(vector => _.pick(vector, 'vertex1', 'vertex2'))
      .map(_.values)
      .thru(vertices => _.xorWith(...vertices, _.isEqual))
      .value();

    // If vectors don't share a vertex we can't invoke the method
    if (diff.length != 2) return NaN;

    const diffVector = new Vector(...diff);

    const selfLength = this.getLength();
    const vectorLength = vector.getLength();
    const diffLength = diffVector.getLength();

    return Math.acos(
      (diffLength ** 2 - selfLength ** 2 - vectorLength ** 2) /
      (-2 * selfLength * vectorLength)
    );
  }

  // Rotate counter clockwise
  rotate(radians, pivot = this.vertex2) {
    const radiansX = Math.cos(radians);
    const radiansY = Math.sin(radians);

    const vertices = [this.vertex1, this.vertex2]
      .map((vertex) => ({
        x: vertex.x - pivot.x,
        y: vertex.y - pivot.y
      }))
      .map((vertex) => ({
        x: radiansX * vertex.x - radiansY * vertex.y,
        y: radiansY * vertex.x + radiansX * vertex.y
      }))
      .map((vertex) => ({
        x: vertex.x + pivot.x,
        y: vertex.y + pivot.y
      }));

    return new this.constructor(...vertices);
  }

  // Rounds angle based on the rotation product constant.
  // If rotation product is not defined, will return self
  roundAngle() {
    if (!this.rotationProduct) return this;

    const rotation = this.getAngle();
    const mod = utils.fixedMod(rotation, this.rotationProduct);
    const sign = (Math.abs(mod) / mod) || 1;

    if (mod > this.rotationProduct / 2) {
      return this.rotate(-sign * (mod - this.rotationProduct));
    }
    else {
      return this.rotate(-sign * mod);
    }
  }
}

export default Vector;

Circle = require('./circle');
