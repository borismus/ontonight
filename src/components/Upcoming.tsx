import * as React from 'react';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import TextField from '@material-ui/core/TextField';
import {MusicPlayer} from './MusicPlayer';

import * as moment from 'moment';

import {DatePicker} from './DatePicker';
import {EventItem} from './EventItem';
import {PlacePicker} from './PlacePicker';

import {Event, EventRequest, EventResponse} from '../../functions/src/interfaces';

const API_ROOT = 'https://us-central1-live-music-preview.cloudfunctions.net';
const YMD_FORMAT = 'YYYY-MM-DD';
const VIDEO_ASPECT_RATIO = 1.78;
const VIDEO_CONTROL_HEIGHT = 48;
const VIDEO_MAX_HEIGHT = 240;

interface Props {}

interface State {
  dateType: number;
  loading: boolean;
  // Currently playing video index.
  playIndex: number;
  // Currently playing song details.
  songName: string;
  // How far along we are.
  songProgress: number;
  // Which songs have had errors.
  errorIndices: number[];

  // Event and video requests and responses.
  eventRequest: EventRequest;
  eventResponse: EventResponse;
  eventError: string;

  embedSearchQuery: string;
}

export class Upcoming extends React.Component<Props, State> {
  didPlaceChange = false;
  state = {
    dateType: Number(localStorage.dateType) || 0,
    loading: false,
    playIndex: -1,
    songProgress: 0,
    songName: '',
    errorIndices: [],

    eventRequest: {
      radius: localStorage.radius || 3,
      postal_code: localStorage.postalCode || '98103',
      start_date: this.today,
      end_date: this.daysFromToday(7),
    },
    eventResponse: null,
    eventError: null,
    embedSearchQuery: null,
  }
  musicPlayer = new MusicPlayer();

  componentDidMount() {
    this.musicPlayer.on('ended', () => this.handleSongEnded());
    this.musicPlayer.on('progress',
      (percent: number) => this.handleSongProgress(percent));
  }

  get today() {
    return this.daysFromToday(0);
  }

  daysFromToday(count: number) {
    return moment().add(count, 'days').format(YMD_FORMAT);
  }

  get headlinerNames() {
    if (!this.state.eventResponse) {
      return [];
    }

    return this.state.eventResponse.events.map(
      event => event.performers[0].name);
  }

  render() {
    const {dateType, eventRequest} = this.state;
    let mainStyle = null;

    return (<div>
      <div style={mainStyle}>
        <header>
          <h1>On Tonight</h1>
          <div className="options">
            <DatePicker dateType={dateType}
              onDateChange={this.handleDateChange} />
            <PlacePicker postalCode={eventRequest.postal_code}
              onPlaceChange={this.handlePlaceChange}
              onPlaceSubmit={this.handlePlaceSubmit}
            />
            <TextField
              style={{width: 30}}
              label="radius"
              value={eventRequest.radius}
              onChange={this.handleRadiusChange}
              type="number"
            />
          </div>
        </header>

        {this.renderActions()}
        {this.renderEvents()}
      </div>
    </div>);
  }

  private renderEvents() {
    const {eventResponse, eventError} = this.state;
    let events = null;
    if (eventError) {
      events = createItemWithIcon(eventError, 'error');
    } else if (!eventResponse) {
      events = createItemWithIcon('Loading events...', 'loop');
    } else if (!eventResponse.events || eventResponse.events.length === 0) {
      events = createItemWithIcon('No events found.', 'all_out');
    } else {
      events = eventResponse.events.map((event, eventIndex) => {
        // See if an event pertaining to this video is currently playing.
        const playing = eventIndex === this.state.playIndex;
        let extra;
        if (this.state.errorIndices.indexOf(eventIndex) === -1) {
          extra = playing && this.state.songName;
        } else {
          extra = '(No songs found)';
        }
        const progress = playing ? this.state.songProgress : 0;
        return (
          <EventItem event={event} key={eventIndex}
            highlight={playing}
            progress={progress}
            extra={extra}
            onClick={() => this.handleClickEvent(eventIndex)}/>
          )
      });
    }
    return (<div className="events">
      {events}
    </div>);
  }

  private renderActions() {
    // No actions for now.
    return null;
    if (!this.state.eventResponse) {
      return null;
    }
    return (<div className="actions">
      <Button variant="contained" color="primary"
        onClick={() => this.handlePlay(0)}>
        Play All
        <Icon>play_arrow</Icon>
      </Button>
    </div>);
  }

  private handlePlaceChange = (postalCode: string) => {
    this.didPlaceChange = (postalCode !== this.state.eventRequest.postal_code);
    localStorage.postalCode = postalCode;
    this.setState({
      eventRequest: {
        ...this.state.eventRequest,
        postal_code: postalCode,
      }
    });
  }

  private handlePlaceSubmit = () => {
    // Only update events if the place has actually changed.
    if (this.didPlaceChange) {
      this.updateEvents();
      this.didPlaceChange = false;
    }
  }

  private handleDateChange = (dateType: number, startDate: string, endDate: string) => {
    localStorage.dateType = dateType;
    this.setState({
      dateType,
      eventRequest: {
        ...this.state.eventRequest,
        start_date: startDate, end_date: endDate,
      }
    }, () => this.updateEvents());
  }

  private handleRadiusChange = (event) => {
    const radius = event.target.value;
    localStorage.radius = radius;
    this.setState({
      eventRequest: {
        ...this.state.eventRequest,
        radius,
      }
    }, () => this.updateEvents());
  }

  private async updateEvents() {
    this.handleStop();
    this.setState({loading: true, eventError: null, eventResponse: null});
    try {
      const eventResponse: EventResponse = await this.makeEventRequest(this.state.eventRequest);
      console.log('eventResponse', eventResponse);
      if (eventResponse.error) {
        this.setState({eventError: eventResponse.error});
      } else {
        this.setState({eventResponse, loading: false});
      }
    } catch (e) {
      this.setState({eventError: 'Error loading events'});
      return;
    }

    const performerNames = this.headlinerNames;

    // Populate album art and song IDs for each performer.
    for (let performer of performerNames) {
      //const url = getTopAlbumArt(performer);
    }

    // If there are no performers in this query, load no videos.
    if (performerNames.length === 0) {
      return;
    }
  }

  private handleClickEvent(index = 0) {
    this.setState({songName: '', songProgress: 0});
    // If we click the currently playing event, pause the music.
    if (this.state.playIndex === index) {
      this.handleStop();
    } else {
      this.handlePlay(index);
    }
  }

  private async handlePlay(index = 0) {
    // A specific item was selected to play.
    console.log('handlePlay', index);
    const performerName = this.state.eventResponse.events[index].performers[0].name;
    this.setState({playIndex: index});
    try {
      const result = await this.musicPlayer.playPreview(performerName);
      const quotedSongName = `Previewing ${this.musicPlayer.getSongName()}`;
      this.setState({songName: quotedSongName});
    } catch (e) {
      this.setState({playIndex: -1});
      this.setState({errorIndices: [...this.state.errorIndices, index]});
    }
  }

  private handleStop() {
    this.musicPlayer.stop();
    this.setState({playIndex: -1});
  }

  private handleSongEnded() {
    // If the song just ends on its own, stop.
    console.log('handleSongEnded');
    this.handleStop();
  }

  private handleSongProgress(percent: number) {
    console.log('handleSongProgress', percent);
    this.setState({
      songProgress: percent,
    });
  }


  /*** DATA ACQUISITION ***/
  private async makeEventRequest(eventRequest: EventRequest): Promise<EventResponse> {
    console.log('eventRequest', eventRequest);
    const {radius, postal_code, start_date, end_date} = eventRequest;
    const url = `${API_ROOT}/listLiveMusicNearby?radius=${radius}&postal_code=${postal_code}&start_date=${start_date}&end_date=${end_date}`;
    const res = await fetch(url);
    if (res.status === 500) {
      return {error: await res.text()};
    }
    const json = await res.json();
    return json;
  }
}

function pickRandom(array: any[]) {
  const n = array.length;
  const i = Math.floor(Math.random() * n);
  return array[i];
}

function createItemWithIcon(title: string, iconName: string) {
  return (<ListItem>
    <ListItemIcon>
      <Icon>{iconName}</Icon>
    </ListItemIcon>
    {title}
  </ListItem>);
}
