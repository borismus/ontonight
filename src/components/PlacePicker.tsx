import * as React from 'react';
import TextField from '@material-ui/core/TextField';

interface Props {
  postalCode: string;
  onPlaceChange(postalCode: string): void;
}

export const PlacePicker: React.StatelessComponent<Props> = (props) => {
  const handlePostalCode = (event) => {
    const postalCode = event.target.value;
    props.onPlaceChange(postalCode);
  }


  return (
    <div>
      <TextField
        label="Postal Code"
        value={props.postalCode}
        onChange={handlePostalCode}
        InputLabelProps={{
          shrink: true,
        }}
        margin="normal"
        variant="filled"
      />
    </div>
    );
}
