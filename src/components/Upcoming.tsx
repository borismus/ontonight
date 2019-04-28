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

import {Event, EventRequest, EventResponse, PerformerVideo,
  VideoRequest, VideoResponse} from '../../functions/src/interfaces';

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
  videoRequest: VideoRequest;
  videoResponse: VideoResponse;
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

    // Test data for rendering.
    videoRequest: null,
    videoResponse: null,
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

  get uniquePerformerNames() {
    const performers = [];
    if (!this.state.eventResponse) {
      return performers;
    }

    for (let event of this.state.eventResponse.events) {
      for (let perf of event.performers) {
        const {name} = perf;
        // Make sure performers are unique.
        if (performers.indexOf(name) >= 0) {
          continue;
        }
        performers.push(name);
      }
    }
    return performers;
  }

  get allPerformerVideos(): PerformerVideo[] {
    const {videoResponse} = this.state;
    const out = [];
    if (!videoResponse) {
      return out;
    }
    for (let performer in videoResponse.videos) {
      const videos = videoResponse.videos[performer];
      for (let video of videos) {
        out.push(video);
      }
    }
    return out;
  }

  get videoId(): string {
    if (this.state.videoIndex >= 0) {
      return this.allPerformerVideos[this.state.videoIndex].video_id;
    }
    return null;
  }

  render() {
    const {dateType, eventRequest, videoHeight} = this.state;
    let mainStyle = null;
    if (this.videoId) {
      mainStyle = {marginBottom: (videoHeight + VIDEO_CONTROL_HEIGHT)};
    }

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

      {this.renderVideoPlayer()}
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
        // Look up videos for performers involved in this event.
        const [videos, globalIndices] = this.getEventVideos(event);
        // See if an event pertaining to this video is currently playing.
        const highlight = globalIndices.indexOf(this.state.videoIndex) >= 0;
        return (
          <EventItem event={event} videos={videos} key={eventInd}
            highlight={highlight}
            onPlayVideo={ind => this.handlePlayVideo(globalIndices[ind])}/>
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
        onClick={() => this.handleShuffle()}>
        Shuffle All
        <Icon>shuffle</Icon>
      </Button>
    </div>);
  }

  private renderVideoPlayer() {
    const {videoHeight} = this.state;
    const videoId = this.videoId;
    if (!videoId) {
      return null;
    }

    // See https://developers.google.com/youtube/player_parameters for all
    // parameters.
    const opts = {
      width: '100%',
      height: String(videoHeight),
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
      }
    };
    return (<div className="video">
      <YouTube videoId={videoId} opts={opts} onReady={this.handleVideoReady}
        onStateChange={this.handleVideoStateChange}
        onEnd={this.handleVideoEnd} />
      <div className="controls">
        <IconButton className="stop-video" onClick={this.handleStopVideo}>
          <Icon>close</Icon>
        </IconButton>
        <div className="title">{this.state.videoTitle}</div>
        <IconButton className="next-video" onClick={this.handleNextVideo}>
          <Icon>skip_next</Icon>
        </IconButton>
      </div>
    </div>);
  }

  private handleVideoReady = (event) => {
    console.log('handleVideoReady', event);
    event.target.playVideo();
    this.setVideoTitle(event);
  }

  private handleVideoStateChange = (event) => {
    console.log('handleVideoStateChange', event);
    this.setVideoTitle(event);
  }

  private handleVideoEnd = (event) => {
    this.nextVideo();
  }

  private setVideoTitle(event) {
    const data = event.target.getVideoData();
    this.setState({
      videoTitle: data.title,
    });
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

  private handleStopVideo = () => {
    this.setState({videoIndex: -1, shuffling: false});
  }

  private handleNextVideo = () => {
    this.nextVideo();
  }

  private getEventVideos(event: Event): [PerformerVideo[], number[]] {
    // Look up video for each performer.
    const videos = [];
    const indices = [];
    for (let perf of event.performers) {
      const {name} = perf;
      for (const [index, video] of this.allPerformerVideos.entries()) {
        if (video.performer_name == name) {
          videos.push(video);
          indices.push(index);
        }
      }
    }
    return [videos, indices];
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

    const performerNames = this.uniquePerformerNames;

    // If there are no performers in this query, load no videos.
    if (performerNames.length === 0) {
      return;
    }

    // Once we update the events, we should also update the videos.
    this.setState({
      videoRequest: {performer_names: performerNames},
      loadingVideos: true,
    });
    const videoResponse = await this.makeVideoRequest(this.state.videoRequest)
    console.log('videoResponse', videoResponse);
    this.setState({videoResponse, loadingVideos: false});
  }

  private handleShuffle() {
    const afterShuffle = () => {
      // If we're not already playing back, pick a random video to play.
      if (!this.videoId) {
        this.nextVideo();
      }
    };

    this.setState({
      shuffling: true,
    }, afterShuffle);
  }

  private nextVideo() {
    let nextVideoIndex = -1;
    if (this.state.shuffling) {
      // Pick a random video index.
      nextVideoIndex = Math.floor(Math.random() * this.allPerformerVideos.length);
    } else {
      nextVideoIndex = this.state.videoIndex + 1;
    }
    this.setState({
      videoIndex: nextVideoIndex,
    });
  }

  private handlePlayVideo(index: number) {
    // A specific video was selected to play.
    console.log('handlePlayVideo', index);
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

  private async makeVideoRequest(videoRequest: VideoRequest): Promise<VideoResponse> {
    console.log('videoRequest', videoRequest);
    const {performer_names} = this.state.videoRequest;
    for (let name of performer_names) {
      if (name.indexOf(',') >= 0) {
        console.warn(`Artist ${name} has a comma in it. Bad!.`);
      }
    }
    const performerCsv = performer_names.map(name => escape(name)).join(',');
    const url = `${API_ROOT}/listVideosForPerformers?performers=${performerCsv}`;
    console.log('url', url);
    const res = await fetch(url);
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
