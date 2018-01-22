import './description.css';

import React from 'react';
import Scenario from '../scenario';

class Description extends React.Component {
  render() {
    const { title, children } = this.props;

    return (
      <div className="Description">
        <h3 className="Description-title">{title}</h3>

        {this.filterChildren(children).map((child, i) => {
          const Component = this.getChildComponent(child);

          return (
            <Component key={i} {...child} />
          );
        })}
      </div>
    );
  }

  filterChildren(children) {
    const shouldOmit = children.some(child => child.omit);
    const shouldPick = children.some(child => child.pick);

    if (shouldOmit) {
      children = children.filter(child => !child.omit);
    }

    if (shouldPick) {
      children = children.filter(child => child.pick);
    }

    return children;
  }

  getChildComponent(child) {
    return child.children ? Description : Scenario;
  }
}

export default Description;
