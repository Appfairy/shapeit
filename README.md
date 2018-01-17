# Shapeit

**Shapeit** (shape it) is a utility library for Node.JS or the web-browser which will take a set of coordinates representing a roughly drawn shape as an input and will output a fixed shape along with its name. Possible shape estimations are taken from a shape atlas based on a set of threshold constants. Both shape atlas and threshold constants can be explicitly provided by the user, although preexisting values will be used as a fallback if your'e looking for a basic, yet decent functionality.

<p align="center">
  <img src="https://user-images.githubusercontent.com/7648874/35002893-0db4a24a-fb26-11e7-8032-4a22a4246003.gif" />
</p>

## Docs

Shapeit is a function which accepts a single parameter of a roughly drawn shape. The given shape is an array of number pairs representing 2D coordinates with X and Y values. A simple use case can be seen below:

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

The result would also be a shape, but with a much reduced number of coordinates that were best aligned with one of the shapes presented in the shape atlas. The resulted shape would also have an additional `name` field representing the name of the shape. The only exception would be a circle result, where we would have an object with a `center` and `radius` fields:

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

> Default atlas can be viewed in [this file]()

In addition, there are few base shapes which might be estimated regardless of the atlas that we provide:

- **circle**
- **hexagon**
- **octagon**
- **pentagon**
- **open polygon**
- **polygon**
- **rectangle**
- **square**
- **triangle**
- **vector**

Here's an example of how we can create a new instance of Shapeit with an explicitly defined shape atlas:

```js
import shapeit from 'shapeit'

const atlas = {
  parallelogram: [
    [1, 0],
    [5, 0],
    [4, 2],
    [0, 2],
    [1, 0],
  ]
}

const shapethat = shapeit.new({ atlas })

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
assert(prettyParallelogram.name, 'parallelogram') 
```

We can also modify the configuration of an existing Shapeit instance by doing the following:

```js
import shapeit from 'shapeit'

const atlas = {
  parallelogram: [
    [1, 0],
    [5, 0],
    [4, 2],
    [0, 2],
    [1, 0],
  ]
}

shapeit.modify({ atlas })
```

This will not replace the existing atlas, but rather add more shapes that can be a potential match by the algorithm.

### threshold constants

Although many times unnecessary and even dangerous, we can modify the threshold constants. Each threshold is used to detect a specific feature in the given shape so we can determine the final result and fix it accordingly. Here's a list of all thresholds followed by a description of their role:

- **minPolygonArea** - An intersection between 2 vectors will be considered one that forms a polygon only if its area is bigger than this value, which means that intersections that trap a small area won't be considered as ones that form a polygon and won't be taken into account in our calculations. Ranges between 0 to ∞ and defaults to 300.
- **circleReductionAngle** - When trying to match the given shape with a circle, all its angles whose values are greater than this one will be reduced. A higher value will result in a higher probability for a circle match. Ranges between 0 to π and defaults to 0.6.
- **circleClosureDistance** - A given open shape might be considered as a circle only if the distance between the last coordinate and one of the vectors is shorter than this value, which means that a higher value will more likely result in a circle and not an open polygon.  Ranges between 0 to ∞ and defaults to 100.
- **normalDistance** - A given open shape might be automatically closed and matched with one of the shapes in the atlas only if the distance between the last coordinate and one of the vectors is shorter than this value. Ranges between 0 to ∞ and defaults to 90.
- **shapeScore** - The minimum score for a match with one of the shapes in the atlas to be considered as a successful one. A higher value will result in more shapes that are likely to be matched. Ranges between 0 to 1 and defaults to 0.83.
- **radiusesStdRatio** - Used to indicate how evenly distributed are all the radiuses by checking the ratio of their standard deviation with the average radius size. A lower value is more likely to match the given shape with a circle. Ranges between 0 to 1 and defaults to 0.18.
- **minSquareScore** - The minimum score that will gratify a square match, which means that a lower score will more likely match a given shape with a square. Ranges between 0 to 1 and defaults to 0.85.
- **vectorsReductionAngle** - 2 vectors will be reduced into a single vector if the angle between them is lower than this value, otherwise they will be considered as 2 vectors which form a corner. A higher value will reduce more corners and will result in straight lines. Ranges between 0 to π and defaults to 0.3.

> Default thresholds can be viewed in [this file]()

To create a new instance of Shapeit with custom thresholds we can do the following:

```js
import shapeit from 'shapeit'

const thresholds = {
  circleReductionAngle: 0.7,
  circleClosureDistance: 120,
}

const shapethat = shapeit.new({ thresholds })
```

Alternatively, we can also keep a set of threshold constants but only modify few specific ones:

```js
import shapeit from 'shapeit'

const thresholds = {
  circleReductionAngle: 0.7,
  circleClosureDistance: 120,
}

shapeit.modify({ thresholds })
```

## Download

The source is available for download from [GitHub](http://github.com/Appfairy/shapeit). Alternatively, you can install using Node Package Manager (`npm`):

    npm install shapeit
