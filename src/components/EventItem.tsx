import * as React from 'react';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';

import {Event} from '../../functions/src/interfaces';

interface Props {
  event: Event;
  videos?: string[];
  onPlayVideo(video: string): void;
}

export const EventItem: React.StatelessComponent<Props> = (props) => {
  function createVideoButton(video: string, ind: number) {
    return (<IconButton onClick={() => props.onPlayVideo(video)} key={ind}>
      <Icon>play_arrow</Icon>
    </IconButton>);
  }

  const {event, videos} = props;
  const videoButtons = videos.map((v, i) => createVideoButton(v, i));

  return (
    <div className="event">
      <div className="info">
        <div className="title">{event.title}</div>
        <div className="venue">Playing at {event.venue.name}</div>
        <div className="date">{event.datetime_local}</div>
      </div>

      <div className="filler" />

      <div className="videos">{videoButtons}</div>
    </div>
  );
}
