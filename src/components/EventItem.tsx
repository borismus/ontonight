import * as React from 'react';

import Avatar from '@material-ui/core/Avatar';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';


import * as moment from 'moment';

import {Event} from '../../functions/src/interfaces';

const GOOGLE_MAPS_PREFIX = `https://www.google.com/maps/search/?api=1&query=`;

interface Props {
  event: Event;
  onPlay(localIndex: number): void;
  highlight: boolean;
}

export const EventItem: React.StatelessComponent<Props> = (props) => {
  const {event, highlight} = props;
  let humanDate = 'unknown';
  if (event.datetime) {
    const m = moment(event.datetime);
    humanDate = m.format('MMMM D, LT');
  } else if (event.date) {
    const m = moment(event.date);
    humanDate = m.format('MMMM D');
  }
  const {lat, lon} = event.venue.location;
  const venueMapUrl = GOOGLE_MAPS_PREFIX + `${lat},${lon}`;

  // Create an anchor element for scroll purposes. Assumption is that this
  // element is unique for the whole page.
  let anchor = null;
  if (highlight) {
    anchor = (<div id="currently-playing"></div>);
  }

  return (
    <ListItem alignItems="flex-start"
      className={'event' + (highlight ? ' highlight' : '')}>
      <ListItemAvatar>
        <Avatar alt="Performer Image" src="" />
      </ListItemAvatar>
      <ListItemText>
      <div className="event-content">
        <div className="info">
          <div className="title">{event.performers[0].name}</div>
          <a className="venue" href={venueMapUrl} target="_blank">
            {event.venue.name}
          </a>
          <div className="date">{humanDate}</div>
        </div>

        <div className="filler" />
      </div>
    </ListItemText>
    {anchor}
    </ListItem>
  );
}

function htmlDecode(input: string) {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}
