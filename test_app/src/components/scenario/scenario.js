import './scenario.css';

import React from 'react';
import shapeit from 'shapeit';

const LINE_DASH = 5;

class Scenario extends React.Component {
  componentDidMount() {
    const { data } = this.props;
    const input = this.transform(data);
    const out = shapeit(input);

    this.canvas.width = 300;
    this.canvas.height = 300;

    const ctx = this.canvas.getContext('2d');

    ctx.save();

    ctx.strokeWidth = 3;
    ctx.strokeStyle = 'blue';

    // Input
    this.draw(input);

    ctx.strokeStyle = 'red';
    ctx.lineDashOffset = LINE_DASH / 2;
    ctx.setLineDash([LINE_DASH ,LINE_DASH]);

    // Output
    this.draw(out);

    ctx.restore();
  }

  render() {
    const { title } = this.props;

    return (
      <div className="Scenario">
        <h4 className="Scenario-title">{title}</h4>
        <canvas className="Scenario-canvas" ref={ref => this.canvas = ref} />
      </div>
    );
  }

  transform(data) {
    return data.map((vertex) => {
      if (vertex instanceof Array) {
        return vertex;
      }
      else {
        return [vertex.x, vertex.y];
      }
    });
  }

  draw(data) {
    const ctx = this.canvas.getContext('2d');

    ctx.beginPath();

    if (data.center) {
      ctx.arc(...data.center, data.radius, 0, 2 * Math.PI);
    }
    else {
      ctx.moveTo(...data[0]);

      data.slice(1).forEach((vertex) => {
        ctx.lineTo(...vertex);
      });
    }

    ctx.stroke();
  }
}

export default Scenario;
