import * as _ from 'lodash';
import * as utils from '../utils';
import Circle from './circle';
import Vector from './vector';
import Vertex from './vertex';

// Should be imported below class definition
let Rectangle;

class Polygon {
  get isOpen() {
    return !this.isClosed;
  }

  set isOpen(value) {
    return this.isClosed = !value;
  }

  get vertexes() {
    return this._vertexes;
  }

  set vertexes(vertexes) {
    // Getting rid of multiple vertexes in a row. Drawn shapes can always be messy ;-)
    return this._vertexes = vertexes.map(vertexes).filter((currVertex, i) => {
      const prevIndex = utils.fixedMod(i - 1, vertexes.length);
      const prevVertex = vertexes[prevIndex];

      return utils.isSimilar(currVertex.x, currVertex.x) &&
             utils.isSimilar(currVertex.y, currVertex.y);
    });
  }

  get options() {
    return {
      isClosed: this.isClosed
    };
  }

  constructor(vertexes, options = {}) {
    options = Object.assign({
      isClosed: true
    }, options);

    this.vertexes = vertexes;
    this.isClosed = options.isClosed;
  }

  getVectors() {
    const vertexes = this.vertexes;

    const vectors = vertexes.map((vertex, index) => {
      const nextIndex = utils.fixedMod(index + 1, vertexes.length);
      const nextVertex = vertexes[nextIndex];

      return new Vector(vertex, nextVertex);
    });

    if (this.isOpen) {
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

    // Align cosines positions with vertexes positions, since further calculations
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
    const vertexes = this.vertexes;
    let areaSum = 0;
    let x = 0;
    let y = 0;

    vertexes.forEach((currVertex, currIndex) => {
      const nextIndex = (currIndex + 1) % vertexes.length;
      const nextVertex = vertexes[nextIndex];

      const areaDiff = currVertex.x * nextVertex.y - nextVertex.x * currVertex.y;
      areaSum += areaDiff;

      x += (currVertex.x + nextVertex.x) * areaDiff;
      y += (currVertex.y + nextVertex.y) * areaDiff;
    });

    // If this is a straight line
    if (!areaSum) {
      return vertexes.reduce((sumVertex, currVertex) => ({
        x: sumVertex.x + (currVertex.x / this.vertexes.length),
        y: sumVertex.y + (currVertex.y / this.vertexes.length)
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
    return _.minBy(this.vertexes, vertex => vertex.x).x;
  }

  getMaxX() {
    return _.maxBy(this.vertexes, vertex => vertex.x).x;
  }

  getMinY() {
    return _.minBy(this.vertexes, vertex => vertex.y).y;
  }

  getMaxY() {
    return _.maxBy(this.vertexes, vertex => vertex.y).y;
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

    const radius = _.chain(this.vertexes)
      .map(vertex => new Vector(vertex, center).getLength())
      .max()
      .value();

    return new Circle(center, radius);
  }

  // http://stackoverflow.com/questions/16285134/calculating-polygon-area
  getArea() {
    const vertexes = this.vertexes;
    let total = 0;

    for (let i = 0, l = vertexes.length; i < l; i++) {
      const addX = vertexes[i].x;
      const addY = vertexes[i == vertexes.length - 1 ? 0 : i + 1].y;
      const subX = vertexes[i == vertexes.length - 1 ? 0 : i + 1].x;
      const subY = vertexes[i].y;

      total += (addX * addY * 0.5);
      total -= (subX * subY * 0.5);
    }

    return Math.abs(total);
  }

  scale(scale, pivot = this.getCenter()) {
    const vertexes = this.vertexes
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

    return new this.constructor(vertexes, this.options);
  }

  // Rotate counter clockwise
  rotate(radians, pivot = this.getCenter()) {
    const radiansX = Math.cos(radians);
    const radiansY = Math.sin(radians);

    const vertexes = this.vertexes
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

    return new this.constructor(vertexes, this.options);
  }

  moveTo(pivot) {
    const center = this.getCenter();

    const centerDiff = {
      x: pivot.x - center.x,
      y: pivot.y - center.y
    };

    const vertexes = this.vertexes.map((vertex) => ({
      x: vertex.x + centerDiff.x,
      y: vertex.y + centerDiff.y
    }));

    return new this.constructor(vertexes, this.options);
  }

  fitWith(polygon, useMirroring = true) {
    const polygonVectors = polygon.getVectors();
    const polygonLengths = polygon.getLengths(polygonVectors);

    const selfVectors = this.getVectors();
    const selfLengths = this.getLengths(selfVectors);

    const center = polygon.getCenter();
    const radians = [];
    const scales = [];

    for (let i = 0; i < polygon.vertexes.length; i++) {
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
      new this.constructor(this.vertexes.slice(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(radian),

      new this.constructor(this.vertexes.slice(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(-radian),

      new this.constructor(this.vertexes.slice(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(Math.PI + radian),

      new this.constructor(this.vertexes.slice(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(Math.PI - radian),

      new this.constructor(this.vertexes.slice().reverse(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(radian + Math.PI / 2),

      new this.constructor(this.vertexes.slice().reverse(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(-radian - Math.PI / 2),

      new this.constructor(this.vertexes.slice().reverse(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(Math.PI - radian - Math.PI / 2),

      new this.constructor(this.vertexes.slice().reverse(), options)
        .moveTo(center)
        .scale(scale)
        .rotate(Math.PI + radian + Math.PI / 2)
    ];

    if (useMirroring) {
      const mirroredSelf = this.mirror();

      const asymmetric = this.vertexes.some((vertex, index) => {
        return !_.isEqual(vertex, mirroredSelf.vertexes[index]);
      });

      if (asymmetric) {
        candiPolygons.push(mirroredSelf.fitWith(polygon, false));
      }
    }

    // Return the polygon which has the least vertex position diff
    return _.minBy(candiPolygons, (candiPolygon) => {
      return _.sum(candiPolygon.vertexes.map((candiVertex) => {
        return _.min(polygon.vertexes.map((polygonVertex) => {
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

    const vertexes = polygon.vertexes.map(({ x, y }) => ({
      x,
      y: -y
    }));

    return new this.constructor(vertexes, this.options).rotate(-axisAngle);
  }

  // Reduces the level of detail (number of vertexes) of the polygon based on the given
  // threshold: Any vertex with an angle smaller than the provided threshold
  // should be reduced
  reduceLOD(threshold) {
    const cosines = this.getCosines();

    const vertexes = cosines.map((cosine) => {
      // The cosines that we would **not** like to keep
      return isNaN(cosine) || utils.isBetweenThreshold(cosine, Math.PI, threshold);
    })
    // Filter subsequent cosines and treat them as a single angle
    .map((testResult, index) => {
      return !testResult && this.vertexes[index];
    })
    .filter(Boolean);

    // If this was a perfectly straight line all vertexes are gonna be reduced, in which
    // case we gonna return the current polygon manually
    if (vertexes.length < 3) {
      return new Polygon(
        [this.vertexes[0], this.vertexes[this.vertexes.length - 1]], this.options
      );
    }

    // The threshold is a function of the size of the polygon
    const boundingBox = this.getBoundingBox();
    let distanceThreshold = Math.min(boundingBox.getWidth(), boundingBox.getHeight()) / 5;
    distanceThreshold = _.clamp(distanceThreshold, 10, 50);

    // Get rid of vertexes which are close to each other and treat them as one
    vertexes.forEach((vertex) => {
      vertexes.forEach((candiVertex, candiIndex) => {
        if (vertex === candiVertex) return;

        const length = new Vector(vertex, candiVertex).getLength();

        if (length < distanceThreshold) vertexes.splice(candiIndex, 1);
      });
    });

    const polygon = new Polygon(vertexes, this.options);

    // Keep reducing polygon's LOD until completely reduced
    return cosines.length == vertexes.length ? polygon : polygon.reduceLOD(threshold);
  }
}

export default Polygon;

Rectangle = require('./rectangle').default;
