import * as React from 'react';
import TextField from '@material-ui/core/TextField';

import {Event} from '../../functions/src/interfaces';

interface Props {
  event: Event;
  videos?: string[];
}

export const EventItem: React.StatelessComponent<Props> = (props) => {
  const {event} = props;
  return (
    <div className="event">
      <div className="info">
        <div className="title">{event.title}</div>
        <div className="venue">Playing at {event.venue.name}</div>
        <div className="date">{event.datetime_local}</div>
      </div>

      <div className="filler" />

      <div className="videos">{props.videos.length} videos</div>
    </div>
  );
}
