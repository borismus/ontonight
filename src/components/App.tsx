import * as React from 'react';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';

const handleBug = () => {
}

export const App: React.StatelessComponent<{}> = (props) => {
  return (
    <div className="container-fluid">
      <IconButton color="secondary" className="report-bug" onClick={handleBug}>
        <Icon>bug_report</Icon>
      </IconButton>
      <header>live music preview</header>
      {props.children}
    </div>
  );
}
