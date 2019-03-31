import * as React from 'react';
import {Route, BrowserRouter as Router, Switch} from 'react-router-dom';
import {About} from './About';
import {App} from './App';

export const AppRouter: React.StatelessComponent<{}> = () => {
  return (
    <Router>
      <div className="container-fluid">
        <Route component={App} />
        <Switch>
          <Route exact path="/" component={About} />
        </Switch>
      </div>
    </Router>
  );
}
