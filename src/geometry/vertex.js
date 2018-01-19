let NaNVertex;

class Vertex {
  static get NaN() {
    return NaNVertex;
  }

  // Ensures that plain objects are actually instances of the Vertex class
  static map(vertices) {
    return vertices.map(vertex => new Vertex(vertex));
  }

  constructor(x, y) {
    if (arguments.length == 1) {
      if (arguments[0] instanceof Array) {
        [x, y] = arguments[0];
      }
      else if (arguments[0] instanceof Object) {
        { x, y } = arguments[0];
      }
    }

    this.x = x;
    this.y = y;
  }
}

NaNVertex = new Vertex(NaN, NaN);

export default Vertex;
