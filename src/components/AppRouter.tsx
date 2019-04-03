import * as React from 'react';
import {Route, BrowserRouter as Router, Switch} from 'react-router-dom';
import {About} from './About';
import {App} from './App';
import {Upcoming} from './Upcoming';

export const AppRouter: React.StatelessComponent<{}> = () => {
  return (
    <Router>
      <div className="container-fluid">
        <Route component={App} />
        <Switch>
          <Route exact path="/" component={Upcoming} />
          <Route exact path="/about" component={About} />
        </Switch>
      </div>
    </Router>
  );
}
