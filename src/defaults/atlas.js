import * as _ from 'lodash';
import { Circle } from '../geometry';

const atlas = {
  'equilateral triangle': generateEquilateral(3),
  'equilateral pentagon': generateEquilateral(5),
  'equilateral hexagon': generateEquilateral(6),
  'golden-ratio triangle': [
    [ 0, 0            ],
    [ 1, 0            ],
    [ 0, Math.sqrt(3) ],
  ],
  'silver-ratio triangle': [
    [ 0, 0 ],
    [ 1, 0 ],
    [ 0, 1 ],
  ],
  'rhombus': [
    [ -1, 0             ],
    [ 0 , -Math.sqrt(3) ],
    [ 1 , 0             ],
    [ 0 , Math.sqrt(3)  ],
  ],
  'trapezoid': [
    [ 0 , 1 ],
    [ -1, 0 ],
    [ 2 , 0 ],
    [ 1 , 1 ],
  ],
  'concave quadrilateral': [
    [ 0 , 1  ],
    [ -1, -1 ],
    [ 0 , 0  ],
    [ 1 , -1 ],
  ],
  'spark': [
    [ 250 , 0    ],
    [ 50  , 50   ],
    [ 0   , 250  ],
    [ -50 , 50   ],
    [ -250, 0    ],
    [ -50 , -50  ],
    [ 0   , -250 ],
    [ 50  , -50  ],
  ],
  'star': [
    [ 0   , -300 ],
    [ -100, -110 ],
    [ -300, -70  ],
    [ -160, 90   ],
    [ -190, 300  ],
    [ 0   , 210  ],
    [ 190 , 300  ],
    [ 160 , 90   ],
    [ 300 , -70  ],
    [ 100 , -110 ],
  ],
};

// Generates an equilateral polygon with n edges
function generateEquilateral(n) {
  const rad = (2 * Math.PI) / n;
  const circle = new Circle({ x: 0, y: 0 }, 1);

  return _.times(n, i => [
    circle.getX(rad * i),
    circle.getY(rad * i)
  ]);
}

export default atlas;
