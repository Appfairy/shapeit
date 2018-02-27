import './App.css';

import React from 'react';
import { Description } from './components';
import data from './data';

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <Description children={data} />
      </div>
    );
  }
}

export default App;
