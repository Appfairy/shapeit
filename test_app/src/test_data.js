import { Polygon, Vector, Vertex } from 'shapeit/src/geometry';

const center = new Vertex(50, 50);

const simpleVector = new Vector(
  { x: 0  , y: 50 },
  { x: 100, y: 50 },
);

const roughVector = new Polygon([
  { x: 0  , y: 50 },
  { x: 20 , y: 48 },
  { x: 40 , y: 50 },
  { x: 60 , y: 52 },
  { x: 80 , y: 50 },
  { x: 100, y: 48 },
], {
  closed: false,
});

const data = [
  {
    title: "vectors recognition",
    children: [
      {
        title: "simple vector",
        children: [
          {
            title: "0 degrees",
            data: simpleVector.getVertices(),
          },
          {
            title: "15 degrees",
            data: simpleVector.rotate(Math.PI / 12, center).getVertices(),
          },
          {
            title: "30 degrees",
            data: simpleVector.rotate(Math.PI / 12 * 2, center).getVertices(),
          },
          {
            title: "45 degrees",
            data: simpleVector.rotate(Math.PI / 12 * 3, center).getVertices(),
          },
          {
            title: "60 degrees",
            data: simpleVector.rotate(Math.PI / 12 * 4, center).getVertices(),
          },
          {
            title: "75 degrees",
            data: simpleVector.rotate(Math.PI / 12 * 5, center).getVertices(),
          },
          {
            title: "90 degrees",
            data: simpleVector.rotate(Math.PI / 12 * 6, center).getVertices(),
          },
        ]
      },
      {
        title: "rough vector",
        children: [
          {
            title: "0 degrees",
            data: roughVector.vertices,
          },
          {
            title: "15 degrees",
            data: roughVector.rotate(Math.PI / 12, center).vertices,
          },
          {
            title: "30 degrees",
            data: roughVector.rotate(Math.PI / 12 * 2, center).vertices,
          },
          {
            title: "45 degrees",
            data: roughVector.rotate(Math.PI / 12 * 3, center).vertices,
          },
          {
            title: "60 degrees",
            data: roughVector.rotate(Math.PI / 12 * 4, center).vertices,
          },
          {
            title: "75 degrees",
            data: roughVector.rotate(Math.PI / 12 * 5, center).vertices,
          },
          {
            title: "90 degrees",
            data: roughVector.rotate(Math.PI / 12 * 6, center).vertices,
          },
        ]
      }
    ]
  }
];

export default data;
