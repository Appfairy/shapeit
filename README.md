# Shapeit

**Shapeit** (shape it) is a utility library for Node.JS or the web-browser which will take a set of vertices representing a roughly drawn shape as an input and will output a fixed shape along with its name. Possible shape estimations are taken from a shape atlas based on a set of threshold constants. Both shape atlas and threshold constants can be explicitly provided by the user, although preexisting values will be used as a fallback if your'e looking for a basic, yet decent functionality.

<p align="center">
  <img src="https://user-images.githubusercontent.com/7648874/35002893-0db4a24a-fb26-11e7-8032-4a22a4246003.gif" />
</p>

## Docs

Shapeit is a function which accepts a single parameter of a roughly drawn shape. The given shape is an array of number pairs representing 2D vertices with X and Y values. A simple use case can be seen below:

```js
import shapeit from 'shapeit'

const uglySquare = [
  [-0.1, 0   ],
  [4.9 , 0.2 ],
  [10.1, -0.1],
  [10.2, 4.9 ],
  [9.9 , 9.8 ],
  [5.1 , 9.9 ],
  [0.1 , 10  ],
  [-0.1, 4.7 ],
  [0.1 , -0.1],
]

const prettySquare = shapeit(uglySquare)

assert(prettySquare, [[Number, Number]])
assert(prettySquare.name, 'square')
```

The result would also be a shape, but with a much reduced number of vertices that were best aligned with one of the shapes presented in the shape atlas. The resulted shape would also have an additional `name` field representing the name of the shape. The only exception would be a circle result, where we would have an object with a `center` and `radius` fields:

```js
import shapeit from 'shapeit'

const uglyCircle = [
  [1    , 0    ],
  [0.86 , 0.49 ],
  [0.5  , 0.86 ],
  [6.12 , 1    ],
  [-0.49, 0.86 ],
  [-0.86, 0.5  ],
  [-1   , 1.22 ],
  [-0.86, -0.49],
  [-0.5 , -0.86],
  [-1.83, -1   ],
  [0.49 , -0.86],
  [0.86 , -0.5 ],
]

const prettyCircle = shapeit(uglyCircle)

assert(prettyCircle.center, [Number, Number])
assert(prettyCircle.radius, Number)
assert(prettySquare.name, 'circle')
```

A new Shapeit instance can be created with custom configuration using the `new()` method:

```js
import shapeit from 'shapeit'

const shapethat = shapeit.new({
  atlas: {},
  output: {},
  thresholds: {},
})
```

In addition, an existing Shapeit instance configuration can be modified using the `modify()` method:

```js
import shapeit from 'shapeit'

modify.new({
  atlas: {},
  output: {},
  thresholds: {},
})
```

More information regards the configuration options used in the examples above can be found further in the docs section. In addition, here's a list with quick references for each configuration field documentation section:

- [shape atlas](#shape-atlas)
- [threshold constants](#threshold-contants)
- [output options](#output-options)

### shape atlas

As stated in the initial summary, shape atlas and threshold constants can be provided. Let's begin with the shape atlas. The shape atlas is an atlas which contain possible shape estimations, who's geometry might come in one form or another (translated, rotated or mirrored). The default shape atlas might estimate the following shapes:

- **concave quadrilateral**
- **equilateral hexagon**
- **equilateral pentagon**
- **equilateral triangle**
- **golder-ratio triangle**
- **rhombus**
- **silver-ratio triangle**
- **spark**
- **star**
- **trapezoid**

> Default atlas can be viewed in [this file](src/defaults/atlas).

In addition, there are few base shapes which might be estimated regardless of the atlas that we provide:

- **circle**
- **hexagon**
- **octagon**
- **open polygon**
- **pentagon**
- **polygon**
- **rectangle**
- **square**
- **triangle**
- **vector**
- **vector**

#### example

By default, specified atlas shapes will be considered to be a closed polygon:

```js
import shapeit from 'shapeit'

const shapethat = shapeit.new({
  atlas: {
    parallelogram: [
      [1, 0],
      [5, 0],
      [4, 2],
      [0, 2],
      [1, 0],
    ]
  }
})

const uglyParallelogram = [
  [0.9 , 0.1 ],
  [3   , 0.2 ],
  [5.1 , -0.1],
  [4.6 , 0.9 ],
  [4.2 , 2.2 ],
  [2.1 , 2   ],
  [-0.1, 1.9 ],
  [0.4 , 1.1 ],
  [1.2 , -0.1],
]

const prettyParallelogram = shapethat(uglyParallelogram)

assert(prettyParallelogram, [[Number, Number]])
assert(prettyParallelogram.closed, true)
assert(prettyParallelogram.name, 'parallelogram')
```

If we would like to specify an open polygon, instead of providing an object with an extra `closed` boolean field, and the vertexes will be specified under the `vertexes` field:

```js
import shapeit from 'shapeit'

const shapethat = shapeit.new({
  atlas: {
    caret: {
      closed: false,
      vertices: [
        [-1, 0],
        [0 , 1],
        [1 , 0],
      ]
    }
  }
})

const uglyCaret = [
  [-1.1, 0.1  ],
  [-0.1, 0.89 ],
  [1.2 , -0.05],
]

const prettyCaret = shapethat(uglyCaret)

assert(prettyCaret, [[Number, Number]])
assert(prettyCaret.closed, false)
assert(prettyCaret.name, 'caret')
```

### threshold constants

Although many times unnecessary and even dangerous, we can modify the threshold constants. Each threshold is used to detect a specific feature in the given shape so we can determine the final result and fix it accordingly. Here's a list of all thresholds followed by a description of their role:

- **circleReductionAngle** - When trying to match the given shape with a circle, all its angles whose values are greater than this one will be reduced. A higher value will result in a higher probability for a circle match. Ranges between 0 and π and defaults to 0.6.
- **circleClosureDistance** - A given open shape might be considered as a circle only if the distance between the last vertex and one of the vectors is shorter than this value, which means that a higher value will more likely result in a circle and not an open polygon.  Ranges between 0 and ∞ and defaults to 100.
- **normalDistance** - A given open shape might be automatically closed and matched with one of the shapes in the atlas only if the distance between the last vertex and one of the vectors is shorter than this value. Ranges between 0 and ∞ and defaults to 90.
- **radiusesStdRatio** - Used to indicate how evenly distributed are all the radiuses by checking the ratio of their standard deviation with the average radius size. A lower value is more likely to match the given shape with a circle. Ranges between 0 and 1 and defaults to 0.18.
- **minPolygonArea** - An intersection between 2 vectors will be considered one that forms a polygon only if its area is bigger than this value, which means that intersections that trap a small area won't be considered as ones that form a polygon and won't be taken into account in our calculations. Ranges between 0 and ∞ and defaults to 300.
- **minShapeScore** - The minimum score for a match with one of the shapes in the atlas to be considered as a successful one. A higher value will result in more shapes that are likely to be matched. Ranges between 0 and 1 and defaults to 0.83.
- **minSquareScore** - The minimum score that will gratify a square match, which means that a lower score will more likely match a given shape with a square. Ranges between 0 and 1 and defaults to 0.85.
- **vectorsReductionAngle** - 2 vectors will be reduced into a single vector if the angle between them is lower than this value, otherwise they will be considered as 2 vectors which form a corner. A higher value will reduce more corners and will result in straight lines. Ranges between 0 and π and defaults to 0.3.

> Default thresholds can be viewed in [this file](src/defaults/thresholds).

#### example

```js
import shapeit from 'shapeit'

// Circles are more likely to be detected with these thresholds
const shapethat = shapeit.new({
  thresholds: {
    circleReductionAngle: 0.7,
    circleClosureDistance: 120,
  }
})
```

### output options

The output shape can be configured upfront by specifying its output options. The output options are optional and may contain the following fields:

- **rectRotationProduct** - If the output shape is a rectangle, its angle will be rounded to the nearest multiplication of this value. Ranges between 0 and 2π and defaults to π / 8.
- **vectorRotationProduct** - If the output shape is a vector, its angle will be rounded to the nearest multiplication of this value. Ranges between 0 and 2π and defaults to π / 16.

> Default output options can be viewed in [this file](src/defaults/output).

#### example

```js
import shapeit from 'shapeit'

// Will result in vertical or horizontal rectangles and vectors only
const shapethat = shapeit.new({
  output: {
    rectRotationProduct: Math.PI / 2,
    vectorRotationProduct: Math.PI / 2,
  }
})
```

## Download

The source is available for download from [GitHub](http://github.com/Appfairy/shapeit). Alternatively, you can install using Node Package Manager (`npm`):

    npm install shapeit
