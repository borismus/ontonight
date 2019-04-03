import * as React from 'react';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

interface Props {
  onDateChange(startDate: string, endDate: string): void;
}

export const DatePicker: React.StatelessComponent<Props> = (props) => {
  return (
    <FormControl>
      <InputLabel htmlFor="age-simple">Date</InputLabel>
      <Select
        value={10}
        onChange={this.handleChange}
        inputProps={{
          name: 'age',
            id: 'age-simple',
        }}
      >
        <MenuItem value={1}>Today</MenuItem>
        <MenuItem value={2}>Tomorrow</MenuItem>
        <MenuItem value={3}>This weekend</MenuItem>
        <MenuItem value={4}>This week</MenuItem>
      </Select>
    </FormControl>
  );
}
