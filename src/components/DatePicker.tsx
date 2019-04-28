import * as React from 'react';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

import * as moment from 'moment';

const YMD_FORMAT = 'YYYY-MM-DD';

interface Props {
  dateType: number;
  onDateChange(dateType: number, startDate: string, endDate: string): void;
}

const dateTypes = ['today', 'tomorrow', 'this weekend'];

enum DateType {
  TODAY,
  TOMORROW,
  THIS_WEEKEND,
}

let initial = true;
export const DatePicker: React.StatelessComponent<Props> = (props) => {
  function handleDate(event) {
    const dateType = event.target.value;
    updateDate(dateType);
  }

  function updateDate(dateType: DateType) {
    const [start_date, end_date] = getDateRange(dateType);
    props.onDateChange(dateType, start_date, end_date);
  }

  // Terrible hack.
  if (initial) {
    updateDate(props.dateType);
    initial = false;
  }

  const menuItems = dateTypes.map((dateType, ind) =>
    <MenuItem value={ind} key={ind}>{capitalize(dateType)}</MenuItem>
  );


  return (
    <FormControl className="date">
      <InputLabel htmlFor="date">Date</InputLabel>
      <Select
        style={{width: 150}}
        value={props.dateType}
        onChange={handleDate}
        inputProps={{
          name: 'date',
            id: 'date',
        }}
      >
        {menuItems}
      </Select>
    </FormControl>
  );
}

function getDateRange(dateType: DateType) {
  switch (dateType) {
    case DateType.TODAY:
      return [daysFromToday(0), daysFromToday(0)];
    case DateType.TOMORROW:
      return [daysFromToday(1), daysFromToday(1)];
    case DateType.THIS_WEEKEND:
      let weekOffset = 0;
      if (today() === dayOfWeek(7)) {
        // If you check on Sunday, it should give you next weekend.
        weekOffset = 1;
      }
      return [dayOfWeek(5, weekOffset), dayOfWeek(7, weekOffset)];
    default:
      console.error('Unknown DateType', dateType);
  }
}

function today() {
  return daysFromToday(0);
}

function daysFromToday(count: number) {
  return moment().add(count, 'days').format(YMD_FORMAT);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dayOfWeek(day: number, weekOffset = 0) {
  return moment().isoWeekday(day).add(weekOffset, 'weeks').format(YMD_FORMAT);
}
