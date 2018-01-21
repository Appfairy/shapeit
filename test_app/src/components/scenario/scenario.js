import './scenario.css';

import React from 'react';
import shapeit from 'shapeit';

const LINE_DASH = 5;

class Scenario extends React.Component {
  componentDidMount() {
    const { data } = this.props;
    const out = shapeit(data);

    this.canvas.width = 100;
    this.canvas.height = 100;

    const ctx = this.canvas.getContext('2d');

    ctx.save();

    ctx.strokeWidth = 3;
    ctx.strokeStyle = 'blue';

    // Input
    this.draw(data);

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

  draw(data, color) {
    const ctx = this.canvas.getContext('2d');

    ctx.beginPath();

    ctx.moveTo(...data[0]);

    data.slice(1).forEach((vertex) => {
      ctx.lineTo(...vertex);
    });

    ctx.stroke();
  }
}

export default Scenario;
