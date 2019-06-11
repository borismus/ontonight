import * as React from 'react';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import TextField from '@material-ui/core/TextField';
import YouTube from 'react-youtube';

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
  loadingVideos: boolean;

  // Parameters concerning the video player.
  videoIndex: number;
  videoHeight: number;
  videoTitle: string;
  shuffling: boolean;

  // Event and video requests and responses.
  eventRequest: EventRequest;
  eventResponse: EventResponse;
  eventError: string;
}

export class Upcoming extends React.Component<Props, State> {
  didPlaceChange = false;
  state = {
    dateType: Number(localStorage.dateType) || 0,
    loading: false,
    loadingVideos: false,

    videoIndex: -1,
    videoHeight: 0,
    videoTitle: null,
    shuffling: false,

    eventRequest: {
      radius: localStorage.radius || 3,
      postal_code: localStorage.postalCode || '98103',
      start_date: this.today,
      end_date: this.daysFromToday(7),
    },
    eventResponse: null,
    eventError: null,
  }

  componentDidMount() {
    const width = Number(document.body.clientWidth);
    const height = Math.min(width / VIDEO_ASPECT_RATIO, VIDEO_MAX_HEIGHT);
    this.setState({videoHeight: height});
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.videoIndex != this.state.videoIndex) {
      // Scroll to the right event.
      const el = document.querySelector('#currently-playing');
      if (el) {
        el.scrollIntoView();
      }
    }
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
    const {dateType, eventRequest, videoHeight} = this.state;
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
      events = eventResponse.events.map((event, eventInd) => {
        // See if an event pertaining to this video is currently playing.
        const highlight = false;
        return (
          <EventItem event={event} key={eventInd}
            highlight={highlight}
            onPlay={ind => this.handlePlay(eventInd)}/>
          )
      });
    }
    return (<div className="events">
      {events}
    </div>);
  }

  private renderActions() {
    if (!this.state.eventResponse) {
      return null;
    }
    return (<div className="actions">
      <Button variant="contained" color="primary"
        onClick={() => this.handlePlay()}>
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

  private handlePlay(index = 0) {
    // A specific item was selected to play.
    console.log('handlePlay', index);
    this.setState({videoIndex: index, videoTitle: null, shuffling: false});
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
