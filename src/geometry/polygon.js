import * as _ from 'lodash';
import * as utils from '../utils';
import Circle from './circle';
import Vector from './vector';
import Vertex from './vertex';

// Should be imported below class definition
let Rectangle;

class Polygon {
  get opened() {
    return !this.closed;
  }

  set opened(value) {
    return this.closed = !value;
  }

  get vertices() {
    return this._vertices;
  }

  set vertices(vertices) {
    // Getting rid of multiple vertices in a row. Drawn shapes can always be messy ;-)
    return this._vertices = Vertex.map(vertices).filter((currVertex, i) => {
      const prevIndex = utils.fixedMod(i - 1, vertices.length);
      const prevVertex = vertices[prevIndex];

      return !utils.isSimilar(currVertex.x, prevVertex.x) ||
             !utils.isSimilar(currVertex.y, prevVertex.y);
    });
  }

  get options() {
    return {
      closed: this.closed
    };
  }

  constructor(vertices, options = {}) {
    options = Object.assign({
      closed: true
    }, options);

    this.vertices = vertices;
    this.closed = options.closed;
  }

  getVectors() {
    const vertices = this.vertices;

    const vectors = vertices.map((vertex, index) => {
      const nextIndex = utils.fixedMod(index + 1, vertices.length);
      const nextVertex = vertices[nextIndex];

      return new Vector(vertex, nextVertex);
    });

    if (this.opened) {
      vectors.pop();
    }

    return vectors;
  }

  getLengths(vectors = this.getVectors()) {
    return vectors.map(vector => vector.getLength());
  }

  getAngles(vectors = this.getVectors()) {
    return vectors.map(vector => vector.getAngle());
  }

  getCosines(vectors = this.getVectors()) {
    const cosines = vectors.map((vector, index) => {
      const nextIndex = utils.fixedMod(index + 1, vectors.length);
      const nextVector = vectors[nextIndex];

      return vector.cosines(nextVector);
    });

    // Align cosines positions with vertices positions, since further calculations
    // depend on it
    if (cosines.length > 0) {
      cosines.unshift(cosines.pop());
    }

    return cosines;
  }

  // Gets the ratios of all the vectors relatively to the smallest one
  getRatios(vectors = this.getVectors()) {
    const unitVector = vectors.reduce((unitVector, vector) => {
      return vector.getLength() < unitVector.getLength() ? vector : unitVector;
    });

    return vectors.map((vector) => {
      return vector.getLength() / unitVector.getLength();
    });
  }

  // Finds the center of the weight of the polygon
  // Source: http://stackoverflow.com/questions/9692448/how-can-you-find-the-centroid-of-a-concave-irregular-polygon-in-javascript
  getCenter() {
    const vertices = this.vertices;
    let areaSum = 0;
    let x = 0;
    let y = 0;

    vertices.forEach((currVertex, currIndex) => {
      const nextIndex = (currIndex + 1) % vertices.length;
      const nextVertex = vertices[nextIndex];

      const areaDiff = currVertex.x * nextVertex.y - nextVertex.x * currVertex.y;
      areaSum += areaDiff;

      x += (currVertex.x + nextVertex.x) * areaDiff;
      y += (currVertex.y + nextVertex.y) * areaDiff;
    });

    // If this is a straight line
    if (!areaSum) {
      return vertices.reduce((sumVertex, currVertex) => ({
        x: sumVertex.x + (currVertex.x / this.vertices.length),
        y: sumVertex.y + (currVertex.y / this.vertices.length)
      }), {
        x: 0,
        y: 0
      });
    }

    const factor = areaSum * 3;

    return new Vertex({
      x: x / factor,
      y: y / factor
    });
  }

  getMinX() {
    return _.minBy(this.vertices, vertex => vertex.x).x;
  }

  getMaxX() {
    return _.maxBy(this.vertices, vertex => vertex.x).x;
  }

  getMinY() {
    return _.minBy(this.vertices, vertex => vertex.y).y;
  }

  getMaxY() {
    return _.maxBy(this.vertices, vertex => vertex.y).y;
  }

  boundsHaveVertex({ x, y }) {
    if (x < this.getMinX()) return false;
    if (x > this.getMaxX()) return false;
    if (y < this.getMinY()) return true;
    if (y > this.getMinY()) return true;

    return true;
  }

  // Gets an instance of a polygon rectangle containing the polygon
  getBoundingBox() {
    const minX = this.getMinX();
    const maxX = this.getMaxX();
    const minY = this.getMinY();
    const maxY = this.getMaxY();

    return new Rectangle([
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY }
    ]);
  }

  // Gets an instance of the circle surrounding the polygon
  getBoundingCircle() {
    const center = this.getCenter();

    const radius = _.chain(this.vertices)
      .map(vertex => new Vector(vertex, center).getLength())
      .max()
      .value();

    return new Circle(center, radius);
  }

  // http://stackoverflow.com/questions/16285134/calculating-polygon-area
  getArea() {
    const vertices = this.vertices;
    let total = 0;

    for (let i = 0, l = vertices.length; i < l; i++) {
      const addX = vertices[i].x;
      const addY = vertices[i == vertices.length - 1 ? 0 : i + 1].y;
      const subX = vertices[i == vertices.length - 1 ? 0 : i + 1].x;
      const subY = vertices[i].y;

      total += (addX * addY * 0.5);
      total -= (subX * subY * 0.5);
    }

    return Math.abs(total);
  }

  scale(scale, pivot = this.getCenter()) {
    const vertices = this.vertices
      .map((vertex) => ({
        x: vertex.x - pivot.x,
        y: vertex.y - pivot.y
      }))
      .map((vertex) => ({
        x: vertex.x * scale,
        y: vertex.y * scale
      }))
      .map((vertex) => ({
        x: vertex.x + pivot.x,
        y: vertex.y + pivot.y
      }));

    return new this.constructor(vertices, this.options);
  }

  // Rotate counter clockwise
  rotate(radians, pivot = this.getCenter()) {
    const radiansX = Math.cos(radians);
    const radiansY = Math.sin(radians);

    const vertices = this.vertices
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

    return new this.constructor(vertices, this.options);
  }

  moveTo(pivot) {
    const center = this.getCenter();

    const centerDiff = {
      x: pivot.x - center.x,
      y: pivot.y - center.y
    };

    const vertices = this.vertices.map((vertex) => ({
      x: vertex.x + centerDiff.x,
      y: vertex.y + centerDiff.y
    }));

    return new this.constructor(vertices, this.options);
  }

  fitWith(polygon, useMirroring = true) {
    const polygonVectors = polygon.getVectors();
    const polygonLengths = polygon.getLengths(polygonVectors);

    const selfVectors = this.getVectors();
    const selfLengths = this.getLengths(selfVectors);

    const center = polygon.getCenter();
    const radians = [];
    const scales = [];

    for (let i = 0; i < polygon.vertices.length; i++) {
      const polygonVector = polygonVectors[i];
      const polygonLength = polygonLengths[i];

      const selfVector = selfVectors[i];
      const selfLength = selfLengths[i];

      let currRadian = utils.fixedMod(
        Math.PI / 2 - polygonVector.getAngle(selfVector),
        Math.PI / 2
      );
      currRadian = Math.min(currRadian, Math.PI / 2 - currRadian);

      radians.push(currRadian);
      scales.push(polygonLength / selfLength);
    }

    const options = this.options;
    const radian = _.mean(radians);
    const scale = _.mean(scales);

    const candiPolygons = [
      new this.constructor(this.vertices.slice(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(radian),

      new this.constructor(this.vertices.slice(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(-radian),

      new this.constructor(this.vertices.slice(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(Math.PI + radian),

      new this.constructor(this.vertices.slice(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(Math.PI - radian),

      new this.constructor(this.vertices.slice().reverse(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(radian + Math.PI / 2),

      new this.constructor(this.vertices.slice().reverse(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(-radian - Math.PI / 2),

      new this.constructor(this.vertices.slice().reverse(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(Math.PI - radian - Math.PI / 2),

      new this.constructor(this.vertices.slice().reverse(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(Math.PI + radian + Math.PI / 2)
    ];

    if (useMirroring) {
      const mirroredSelf = this.mirror();

      const asymmetric = this.vertices.some((vertex, index) => {
        return !_.isEqual(vertex, mirroredSelf.vertices[index]);
      });

      if (asymmetric) {
        candiPolygons.push(mirroredSelf.fitWith(polygon, false));
      }
    }

    // Return the polygon which has the least vertex position diff
    return _.minBy(candiPolygons, (candiPolygon) => {
      return _.sum(candiPolygon.vertices.map((candiVertex) => {
        return _.min(polygon.vertices.map((polygonVertex) => {
          const xdiff = Math.abs(candiVertex.x - polygonVertex.x);
          const ydiff = Math.abs(candiVertex.y - polygonVertex.y);
          return xdiff + ydiff;
        }));
      }));
    });
  }

  // Mirrors polygon relatively to given axis angle
  mirror(axisAngle = 0) {
    const polygon = this.rotate(axisAngle);

    const vertices = polygon.vertices.map(({ x, y }) => ({
      x,
      y: -y
    }));

    return new this.constructor(vertices, this.options).rotate(-axisAngle);
  }

  // Reduces the level of detail (number of vertices) of the polygon based on the given
  // threshold: Any vertex with an angle smaller than the provided threshold
  // should be reduced
  reduceLOD(threshold) {
    const cosines = this.getCosines();

    const vertices = cosines.map((cosine) => {
      // The cosines that we would **not** like to keep
      return isNaN(cosine) || utils.isBetweenThreshold(cosine, Math.PI, threshold);
    })
    // Filter subsequent cosines and treat them as a single angle
    .map((testResult, index) => {
      return !testResult && this.vertices[index];
    })
    .filter(Boolean);

    // If this was a perfectly straight line all vertices are gonna be reduced, in which
    // case we gonna return the current polygon manually
    if (vertices.length < 3) {
      return new Polygon(
        [this.vertices[0], this.vertices[this.vertices.length - 1]], this.options
      );
    }

    // The threshold is a function of the size of the polygon
    const boundingBox = this.getBoundingBox();
    let distanceThreshold = Math.min(boundingBox.getWidth(), boundingBox.getHeight()) / 5;
    distanceThreshold = _.clamp(distanceThreshold, 10, 50);

    // Get rid of vertices which are close to each other and treat them as one
    vertices.forEach((vertex) => {
      vertices.forEach((candiVertex, candiIndex) => {
        if (vertex === candiVertex) return;

        const length = new Vector(vertex, candiVertex).getLength();

        if (length < distanceThreshold) vertices.splice(candiIndex, 1);
      });
    });

    const polygon = new Polygon(vertices, this.options);

    // Keep reducing polygon's LOD until completely reduced
    return cosines.length == vertices.length ? polygon : polygon.reduceLOD(threshold);
  }
}

export default Polygon;

Rectangle = require('./rectangle').default;
