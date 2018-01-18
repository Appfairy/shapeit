import * as _ from 'lodash';
import { fixedMod } from '../utils';
import Circle from './circle';
import Polygon from './polygon';
import Vector from './vector';

const ROTATION_SEGMENT = Math.PI / 8;

class Rectangle extends Polygon {
  // Creates a new rectangle instance given position and dimensions
  static fromScalars(x, y, w, h) {
    return new Rectangle([
      { x: x, y: y },
      { x: x + w, y: y },
      { x: x + w, y: y + h },
      { x: x, y: y + h },
    ]);
  }

  constructor(vertexes) {
    super(vertexes, { isClosed: true });

    if (vertexes.length != 4) {
      throw TypeError('A rectangle must have 4 corners');
    }

    const cosines = this.getCosines();

    cosines.forEach((cosine) => {
      if (cosine.toFixed(5) != (Math.PI / 2).toFixed(5)) {
        throw TypeError('All angles must be 1/2 radians');
      }
    });
  }

  getWidth(vectors = this.getVectors()) {
    return _.minBy(vectors, vector => Math.abs(vector.getAngle())).getLength();
  }

  getHeight(vectors = this.getVectors()) {
    return _.maxBy(vectors, vector => Math.abs(vector.getAngle())).getLength();
  }

  getRotation() {
    return _.minBy(this.getAngles(), Math.abs);
  }

  getIndexCorner() {
    const center = this.getCenter();
    const rotation = this.getRotation();
    const realRect = this.rotate(-rotation);
    const r = new Vector(center, this.vertexes[0]).getLength();
    const circle = new Circle(center, r);
    const x = realRect.getMinX();
    const y = realRect.getMinY();
    const rad = circle.getRad(x, y);

    return circle.getVertex(rad + rotation);
  }

  // Rectangles' angles should be rounded, since this is most likely what the user wants
  fitWith(polygon, useMirroring) {
    let fitPolygon = super.fitWith(polygon, useMirroring);

    const rotation = fitPolygon.getRotation();
    const mod = fixedMod(rotation, ROTATION_SEGMENT);
    const sign = (Math.abs(mod) / mod) || 1;

    if (mod > ROTATION_SEGMENT / 2) {
      fitPolygon = fitPolygon.rotate(-sign * (mod - ROTATION_SEGMENT));
    }
    else {
      fitPolygon = fitPolygon.rotate(-sign * mod);
    }

    return fitPolygon;
  }

  // Alias boundsHaveVertex()
  containsVertex(vertex) {
    return this.boundsHaveVertex(vertex);
  }
}

export default Rectangle;
