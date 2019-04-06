import * as React from 'react';
import TextField from '@material-ui/core/TextField';

const ENTER_KEY = 13;

interface Props {
  postalCode: string;
  onPlaceChange(postalCode: string): void;
  onPlaceSubmit(): void;
}

export const PlacePicker: React.StatelessComponent<Props> = (props) => {
  function handleChange(event) {
    const postalCode = event.target.value;
    props.onPlaceChange(postalCode);
  }

  function handleBlur(event) {
    props.onPlaceSubmit();
  }

  function handleKeyDown(event) {
    if (event.keyCode === ENTER_KEY) {
      props.onPlaceSubmit();
    }
  }

  return (
    <div>
      <TextField
        style={{width: 100}}
        label="Postal Code"
        value={props.postalCode}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
    );
}
