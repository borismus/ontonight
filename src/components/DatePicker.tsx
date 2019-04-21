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

const dateTypes = ['today', 'tomorrow', 'this weekend', 'next seven days', 'next thirty days'];

enum DateType {
  TODAY,
  TOMORROW,
  THIS_WEEKEND,
  NEXT_7_DAYS,
  NEXT_30_DAYS,
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
      return [daysFromToday(0), daysFromToday(1)];
    case DateType.TOMORROW:
      return [daysFromToday(1), daysFromToday(2)];
    case DateType.THIS_WEEKEND:
      return [dayOfWeek(5), dayOfWeek(7)];
    case DateType.NEXT_7_DAYS:
      return [daysFromToday(0), daysFromToday(7)];
    case DateType.NEXT_30_DAYS:
      return [daysFromToday(0), daysFromToday(30)];
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

function dayOfWeek(day: number, weeks?: number) {
  weeks = weeks || 0;
  return moment().isoWeekday(day).add(weeks, 'weeks').format(YMD_FORMAT);
}
