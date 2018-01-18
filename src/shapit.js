import * as _ from 'lodash';
import * as utils from '../utils';

import {
  output as defaultOutput,
  thresholds as defaultThresholds,
} from './defaults';

import {
  Circle,
  Polygon,
  Rectangle,
  Vector,
  Vertex
} from '../../geometry';

function createShapeit(config = {}) {
  const { thresholds } = config = _.mergeDeep({
    atlas: {},
    output: defaultOutput,
    thresholds: defaultThresholds,
  }, config);

  // Wrapping all provided polygon data with polygon classes
  const atlas = transformAtlas(config.atlas);

  // Square is a very basic and important shape which will always be added by default
  atlas.square = {
    name: 'square',
    geometry: new Rectangle([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
    ]),
  };

  // A wrap around the result of the detectShape() function
  function shapeit(vertexes) {
    const result = detectShape(vertexes);
    let shape;

    switch (result.name) {
      case 'circle':
        const center = result.geometry.getCenter();

        shape = {
          center: [center.x, center.y],
          radius: result.geometry.getRadius(),
        };

        break;

      case 'vector':
        shape = [result.geometry.vertex1, result.geometry.vertex2];

        break;

      default:
        shape = result.geometry.vertexes;
    }

    shape.name = result.name;

    return result;
  }

  // The actual handler which detects the shape
  function detectShape(vertexes) {
    // An array which is future to contain sub polygons created by intersections
    const subPolygons = [];

    for (let i = 2; i < vertexes.length - 1; i++) {
      const vertex = vertexes[i];
      const nextVertex = vertexes[i + 1];
      let vector = new Vector(vertex, nextVertex);

      // We will normalize the last vertex in hope to find intersection
      if (i == vertexes.length - 2) {
        vector = vector.normalizeLength(thresholds.normalDistance, vertex);
      }

      for (let j = 0; j < i - 1; j++) {
        const candiVertex = vertexes[j];
        const nextCandiVertex = vertexes[j + 1];
        let candiVector = new Vector(candiVertex, nextCandiVertex);

        // We will normalize the first vertex in hope to find intersection
        if (j == 0) {
          candiVector = candiVector.normalizeLength(thresholds.normalDistance, nextCandiVertex);
        }

        const angle = vector.getAngle(candiVector);

        // Intersection will count but only from a certain intersection angle
        if (utils.isBetweenThreshold(angle, 0, thresholds.vectorsReductionAngle) ||
            utils.isBetweenThreshold(angle, Math.PI, thresholds.vectorsReductionAngle)) {
          continue;
        }

        const intersectionVertex = candiVector.getIntersection(vector);

        if (intersectionVertex === Vertex.NaN) continue;

        const subVertexes = vertexes.slice(j + 1, i).concat(intersectionVertex);
        const subPolygon = new Polygon(subVertexes);

        // Ignore polygons with small areas
        if (subPolygon.getArea() > thresholds.minPolygonArea) {
          subPolygons.push(subPolygon);
        }

        // Note that we change the vertexes reference so further calculations with sub
        // polygon won't include remainder polygon
        vertexes = vertexes
          .slice(0, j)
          .concat(intersectionVertex)
          .concat(vertexes.slice(i + 1));

        // Update outer index counter to match changes
        i = j;
        break;
      }
    }

    let polygon;

    // If no sub polygons found just use the provided vertexes
    if (subPolygons.length == 0) {
      polygon = new Polygon(vertexes);
    }
    // Else, assume that the polygon with the biggest area is what we're interested in
    else {
      polygon = _.maxBy(subPolygons, polygon => polygon.getArea());
    }

    const circle = tryCircle(polygon);
    if (circle) return circle;

    // We will reduce the level of detail of the polygon to get rid of unnecessary features
    const reducedPolygon = polygon.reduceLOD(thresholds.vectorsReductionAngle);

    // If resulted polygon is not closed or we didn't find any intersections in the process
    // try to find for alternatives besides a polygon
    if (reducedPolygon.vertexes.length < 3 || subPolygons.length == 0) {
      const circle = tryCircle(polygon);
      if (circle) return circle;

      const resultVectors = reducedPolygon
        .getVectors()
        // Note that we remove the last vector since this is not really a polygon
        .slice(0, -1)
        // If this is a single vector polygon, there will be a single 'undefined' element
        // which needs to be filtered
        .filter(Boolean);

      // If polygon is completely reduced, this is a single vector
      if (resultVectors.length == 0) {
        resultVectors.push(new Vector(
          polygon.vertexes[0],
          polygon.vertexes[polygon.vertexes.length - 1]
        ));
      }

      const resultVertexes =_.chain(resultVectors)
        .map(vector => vector.getVertexes())
        .flatten()
        .value();

      // This is a vector, we wanna round the angle up before we return it
      if (resultVertexes.length == 2) {
        return {
          name: 'vector',
          geometry: new Vector(...resultVertexes).roundAngle()
        };
      }
      // Otherwise this us probably a vectors set
      else {
        return {
          name: 'open polygon',
          geometry: new Polygon(resultVertexes, { isClosed: false })
        };
      }
    }

    const vectors = reducedPolygon.getVectors();
    const cosines = reducedPolygon.getCosines(vectors);
    const ratios = reducedPolygon.getRatios(vectors);

    // Find the shape pattern which matches all the values
    const scores = atlas.map((shapePattern) => {
      const shapeCosines = shapePattern.geometry.getCosines();
      const shapeRatios = shapePattern.geometry.getRatios();

      const cosinesScore = utils.matchScore(shapeCosines, cosines);
      const ratiosScore = utils.matchScore(shapeRatios, ratios);

      // A multiplication method will enhance the value of the score, e.g.
      // if on of the scores is low then the final score is gonna be extremely low
      const score = new Number(cosinesScore * ratiosScore);

      // Determine score properties
      Object.assign(score, _.max([
        utils.matchScore(shapeCosines, cosines, ratiosScore.offset + 1, ratiosScore.offset),
        utils.matchScore(shapeRatios, ratios, cosinesScore.offset + 1, cosinesScore.offset)
      ]));

      return score;
    });

    // This index will also be used to find the shape pattern, not just the score
    const matchingPatternIndex = _.maxBy(Object.keys(scores), (index) => {
      return scores[index];
    });

    const bestScore = scores[matchingPatternIndex];

    // Align the element of the shape with the elements of the polygon
    for (let i = 0; i < bestScore.offset; i++) {
      reducedPolygon.vertexes.push(reducedPolygon.vertexes.shift());
    }

    const shapePattern = _.clone(atlas[matchingPatternIndex]);
    const scoreThreshold = shapePattern.name == 'square' ?
      thresholds.minSquareScore : getScoreThreshold(reducedPolygon.vertexes.length);

    // If the maximum score passes the threshold test, return its shape pattern
    if (bestScore > scoreThreshold) {
      shapePattern.geometry = shapePattern.geometry.fitWith(reducedPolygon);
      return shapePattern;
    }

    const shape = {
      name: 'polygon',
      geometry: reducedPolygon
    };

    switch (reducedPolygon.vertexes.length) {
      case 3: shape.name = 'triangle'; break;
      case 4: handleQuadShape(shape); break;
      case 5: shape.name = 'pentagon'; break;
      case 6: shape.name = 'hexagon'; break;
      case 8: shape.name = 'octagon'; break;
    }

    return shape;
  }

  function tryCircle(polygon) {
    // Reduce polygon to see if a circle is even considered an option
    if (polygon.reduceLOD(thresholds.circleReductionAngle).vertexes.length > 3) return;

    // Explicitly creating the closure vector in case the polygon is open
    const closureVector = new Vector(
      polygon.vertexes[0],
      polygon.vertexes[polygon.vertexes.length - 1]
    );

    // The closure distance needs to pass a threshold test in-order for the shape detector
    // to even try to form a circle
    if (closureVector.getLength() > thresholds.circleClosureDistance) return;

    const center = polygon.getCenter();

    const radiuses = polygon.vertexes.map((vertex) => {
      return new Vector(center, vertex).getLength();
    });

    const radiusesSTD = utils.getStandardDeviation(radiuses);
    const meanRadius = _.mean(radiuses);
    const STDratio = radiusesSTD / meanRadius;

    // If the standard deviation is low enough to accept, assume this is a circle.
    // The null will be used to indicate that a circle indeed doesn't match
    if (STDratio > thresholds.radiusesStdRatio) return;

    return {
      name: 'circle',
      geometry: new Circle(center, meanRadius)
    };
  }

  function handleQuadShape(shape) {
    shape.name = 'quadrilateral';

    const polygon = shape.geometry;
    const cosines = polygon.getCosines();
    const score = utils.matchScore(cosines, _.times(4, () => Math.PI / 2));

    if (score < thresholds.minSquareScore) return;

    // In case this is a potential rectangle, we will do a special handling for it
    shape.name = 'rectangle';

    const lengths = polygon.getLengths();
    const verticalLength = _.mean([lengths[0], lengths[2]]);
    const horizontalLength = _.mean([lengths[1], lengths[3]]);

    shape.geometry = new Rectangle([
      { x: 0, y: verticalLength },
      { x: 0, y: 0 },
      { x: horizontalLength, y: 0 },
      { x: horizontalLength, y: verticalLength }
    ]).fitWith(shape.geometry);
  }

  // Gets a score threshold based on the number of edges. The higher the number of
  // edges is gonna be, the lower the threshold will be as well
  function getScoreThreshold(edgesNumber) {
    return Math.sin((Math.PI / 2) * (thresholds.minShapeScore ** (edgesNumber)));
  }

  Object.assign(shapeit, {
    new: createShapeit,

    getConfig() {
      return _.cloneDeep(config);
    },

    getAtlas() {
      return { ...atlas };
    },

    getThresholds() {
      return { ...thresholds };
    },

    modify(mod = {}) {
      mod = {
        atlas: {},
        output: {},
        thresholds: {},
        ...mod,
      };

      Object.assign(atlas, transformAtlas(mod.atlas));
      Object.assign(output, mod.output);
      Object.assign(thresholds, mod.thresholds);

      return shapeit;
    },
  });

  return shapeit;
}

// Wrapping all provided polygon data with polygon classes
function transformAtlas(atlas) {
  return _.transform(atlas, (atlas, coords, name) => ({
    name,
    geometry: new Polygon(coords),
  }));
}

export default detectShape;
