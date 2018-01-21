import './description.css';

import React from 'react';
import Scenario from '../scenario';

class Description extends React.Component {
  render() {
    const { title, children } = this.props;

    return (
      <div className="Description">
        <h3 className="Description-title">{title}</h3>

        {children.map((child, i) => {
          const Component = this.getChildComponent(child);

          return (
            <Component key={i} {...child} />
          );
        })}
      </div>
    );
  }

  getChildComponent(child) {
    return child.children ? Description : Scenario;
  }
}

export default Description;
