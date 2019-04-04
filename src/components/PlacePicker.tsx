import * as React from 'react';
import TextField from '@material-ui/core/TextField';

interface Props {
  postalCode: string;
  onPlaceChange(postalCode: string): void;
}

export const PlacePicker: React.StatelessComponent<Props> = (props) => {
  function handlePostalCode(event) {
    const postalCode = event.target.value;
    props.onPlaceChange(postalCode);
  }


  return (
    <div>
      <TextField
        style={{width: 100}}
        label="Postal Code"
        value={props.postalCode}
        onChange={handlePostalCode}
      />
    </div>
    );
}
