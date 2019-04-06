import * as React from 'react';

import Avatar from '@material-ui/core/Avatar';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import TextField from '@material-ui/core/TextField';

import * as moment from 'moment';

import {Event} from '../../functions/src/interfaces';

interface Props {
  event: Event;
  videos?: string[];
  onPlayVideo(video: string): void;
}

export const EventItem: React.StatelessComponent<Props> = (props) => {
  function createVideoButton(video: string, ind: number) {
    return (<IconButton className="play-video"
        onClick={() => props.onPlayVideo(video)} key={ind}>
      <Icon>play_arrow</Icon>
    </IconButton>);
  }

  const {event, videos} = props;
  const videoButtons = videos.map((v, i) => createVideoButton(v, i));
  const m = moment(event.datetime_local);
  const humanDate = m.format('MMMM D, LT');
  const performerImage = event.performers[0].image;

  return (
    <ListItem alignItems="flex-start" className="event">
      <ListItemAvatar>
        <Avatar alt="Remy Sharp" src={performerImage} />
      </ListItemAvatar>
      <ListItemText>
      <div className="event-content">
        <div className="info">
          <div className="title">{event.title}</div>
          <div className="venue">{event.venue.name}</div>
          <div className="date">{humanDate}</div>
        </div>

        <div className="filler" />

        <div className="videos">{videoButtons}</div>
      </div>
    </ListItemText>
    </ListItem>
  );
}
