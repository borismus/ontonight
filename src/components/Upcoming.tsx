import * as React from 'react';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import Divider from '@material-ui/core/Divider';
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
const VIDEO_MAX_HEIGHT = 200;

interface Props {}

interface State {
  dateType: number;
  loading: boolean;
  loadingVideos: boolean;

  // Parameters concerning the video player.
  videoId: string;
  videoHeight: number;
  videoTitle: string;
  shuffling: boolean;

  // Event and video requests and responses.
  eventRequest: EventRequest;
  eventResponse: EventResponse;
  videoRequest: VideoRequest;
  videoResponse: VideoResponse;
}

export class Upcoming extends React.Component<Props, State> {
  state = {
    dateType: Number(localStorage.dateType) || 0,
    loading: false,
    loadingVideos: false,

    videoId: null,
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

    // Test data for rendering.
    //eventResponse: JSON.parse(`{"events":[{"title":"Tommy Genesis (21+)","url":"https://seatgeek.com/tommy-genesis-21-tickets/seattle-washington-high-dive-2019-04-02-7-30-pm/concert/4714122","datetime_local":"2019-04-02T19:30:00","venue":{"links":[],"metro_code":819,"postal_code":"98103","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":2588,"city":"Seattle","extended_address":"Seattle, WA 98103","display_location":"Seattle, WA","state":"WA","score":0.3715495,"location":{"lat":47.6513,"lon":-122.352},"access_method":null,"num_upcoming_events":29,"address":"513 North 36th Street","capacity":0,"slug":"high-dive","name":"High Dive","url":"https://seatgeek.com/venues/high-dive/tickets","country":"US","popularity":0,"name_v2":"High Dive"},"performers":[{"name":"Tommy Genesis","image":"https://seatgeek.com/images/performers-landscape/tommy-genesis-95a2b6/497395/huge.jpg"}]},{"title":"Zero Theorem","url":"https://seatgeek.com/zero-theorem-tickets/seattle-washington-el-corazon-2019-04-02-8-30-pm/concert/4755204","datetime_local":"2019-04-02T20:30:00","venue":{"links":[],"metro_code":819,"postal_code":"98109","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":1178,"city":"Seattle","extended_address":"Seattle, WA 98109","display_location":"Seattle, WA","state":"WA","score":0.41065976,"location":{"lat":47.6188,"lon":-122.329},"access_method":null,"num_upcoming_events":101,"address":"109 Eastlake Avenue East","capacity":800,"slug":"el-corazon","name":"El Corazon","url":"https://seatgeek.com/venues/el-corazon/tickets","country":"US","popularity":0,"name_v2":"El Corazon"},"performers":[{"name":"Zero Theorem","image":"https://seatgeek.com/images/performers-landscape/zero-theorem-f7e79f/692571/huge.jpg"}]},{"title":"We Came As Romans with Crown The Empire and Erra","url":"https://seatgeek.com/we-came-as-romans-with-crown-the-empire-and-erra-tickets/seattle-washington-el-corazon-2019-04-03-6-30-pm/concert/4737319","datetime_local":"2019-04-03T18:30:00","venue":{"links":[],"metro_code":819,"postal_code":"98109","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":1178,"city":"Seattle","extended_address":"Seattle, WA 98109","display_location":"Seattle, WA","state":"WA","score":0.41065976,"location":{"lat":47.6188,"lon":-122.329},"access_method":null,"num_upcoming_events":81,"address":"109 Eastlake Avenue East","capacity":800,"slug":"el-corazon","name":"El Corazon","url":"https://seatgeek.com/venues/el-corazon/tickets","country":"US","popularity":0,"name_v2":"El Corazon"},"performers":[{"name":"We Came As Romans","image":"https://seatgeek.com/images/performers-landscape/we-came-as-romans-20f364/7085/huge.jpg"},{"name":"Erra","image":"https://seatgeek.com/images/performers-landscape/erra-7dc4d3/19529/huge.jpg"},{"name":"Crown The Empire","image":"https://seatgeek.com/images/performers-landscape/crown-the-empire-9506e9/61966/huge.jpg"}]},{"title":"Queensryche with Fates Warning","url":"https://seatgeek.com/queensryche-with-fates-warning-tickets/seattle-washington-neptune-theatre-2019-04-03-8-pm/concert/4610432","datetime_local":"2019-04-03T20:00:00","venue":{"links":[],"metro_code":819,"postal_code":"98105","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":5805,"city":"Seattle","extended_address":"Seattle, WA 98105","display_location":"Seattle, WA","state":"WA","score":0.5249145,"location":{"lat":47.6613,"lon":-122.314},"access_method":null,"num_upcoming_events":34,"address":"1303 Northeast 45th Street","capacity":479,"slug":"neptune-theatre","name":"Neptune Theatre","url":"https://seatgeek.com/venues/neptune-theatre/tickets","country":"US","popularity":0,"name_v2":"Neptune Theatre"},"performers":[{"name":"Queensryche","image":"https://seatgeek.com/images/performers-landscape/queensryche-5fc9f9/1480/huge.jpg"},{"name":"Fates Warning","image":"https://seatgeek.com/images/performers-landscape/fates-warning-3924f7/58774/huge.jpg"}]},{"title":"Mortiis with God Module","url":"https://seatgeek.com/mortiis-with-god-module-tickets/seattle-washington-el-corazon-2019-04-04-7-30-pm/concert/4667373","datetime_local":"2019-04-04T19:30:00","venue":{"links":[],"metro_code":819,"postal_code":"98109","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":1178,"city":"Seattle","extended_address":"Seattle, WA 98109","display_location":"Seattle, WA","state":"WA","score":0.41065976,"location":{"lat":47.6188,"lon":-122.329},"access_method":null,"num_upcoming_events":98,"address":"109 Eastlake Avenue East","capacity":800,"slug":"el-corazon","name":"El Corazon","url":"https://seatgeek.com/venues/el-corazon/tickets","country":"US","popularity":0,"name_v2":"El Corazon"},"performers":[{"name":"God Module","image":null},{"name":"Mortiis","image":"https://seatgeek.com/images/performers-landscape/mortiis-a0ed97/246041/huge.jpg"}]},{"title":"Ayla Nereo","url":"https://seatgeek.com/ayla-nereo-tickets/seattle-washington-tractor-tavern-2019-04-04-8-pm/concert/4707346","datetime_local":"2019-04-04T20:00:00","venue":{"links":[],"metro_code":819,"postal_code":"98107","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":722,"city":"Seattle","extended_address":"Seattle, WA 98107","display_location":"Seattle, WA","state":"WA","score":0.40448612,"location":{"lat":47.6657,"lon":-122.383},"access_method":null,"num_upcoming_events":16,"address":"5213 Ballard Ave NW","capacity":400,"slug":"tractor-tavern","name":"Tractor Tavern","url":"https://seatgeek.com/venues/tractor-tavern/tickets","country":"US","popularity":0,"name_v2":"Tractor Tavern"},"performers":[{"name":"Ayla Nereo","image":"https://seatgeek.com/images/performers-landscape/ayla-nereo-aa5797/144269/huge.jpg"}]},{"title":"Jack & Jack","url":"https://seatgeek.com/jack-and-jack-tickets/seattle-washington-neptune-theatre-2019-04-05-8-pm/concert/4636823","datetime_local":"2019-04-05T20:00:00","venue":{"links":[],"metro_code":819,"postal_code":"98105","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":5805,"city":"Seattle","extended_address":"Seattle, WA 98105","display_location":"Seattle, WA","state":"WA","score":0.5249145,"location":{"lat":47.6613,"lon":-122.314},"access_method":null,"num_upcoming_events":34,"address":"1303 Northeast 45th Street","capacity":479,"slug":"neptune-theatre","name":"Neptune Theatre","url":"https://seatgeek.com/venues/neptune-theatre/tickets","country":"US","popularity":0,"name_v2":"Neptune Theatre"},"performers":[{"name":"Jack & Jack","image":"https://seatgeek.com/images/performers-landscape/jack-jack-5632e3/284175/huge.jpg"}]},{"title":"Wicca Phase Springs Eternal with Horse Head","url":"https://seatgeek.com/wicca-phase-springs-eternal-with-horse-head-tickets/seattle-washington-vera-project-2019-04-05-8-pm/concert/4710233","datetime_local":"2019-04-05T20:00:00","venue":{"links":[],"metro_code":819,"postal_code":"98109","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":2187,"city":"Seattle","extended_address":"Seattle, WA 98109","display_location":"Seattle, WA","state":"WA","score":0.30452064,"location":{"lat":47.6219,"lon":-122.352},"access_method":null,"num_upcoming_events":8,"address":"305 Harrison Street","capacity":0,"slug":"vera-project","name":"Vera Project","url":"https://seatgeek.com/venues/vera-project/tickets","country":"US","popularity":0,"name_v2":"Vera Project"},"performers":[{"name":"Horse Head","image":"https://seatgeek.com/images/performers-landscape/horse-head-35d418/98980/huge.jpg"},{"name":"Wicca Phase Springs Eternal","image":"https://seatgeek.com/images/performers-landscape/wicca-phase-springs-eternal-b1d137/670616/huge.jpg"}]},{"title":"S.U.S. with Vibe","url":"https://seatgeek.com/s-u-s-with-vibe-tickets/seattle-washington-el-corazon-2019-04-05-8-30-pm/concert/4781124","datetime_local":"2019-04-05T20:30:00","venue":{"links":[],"metro_code":819,"postal_code":"98109","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":1178,"city":"Seattle","extended_address":"Seattle, WA 98109","display_location":"Seattle, WA","state":"WA","score":0.41065976,"location":{"lat":47.6188,"lon":-122.329},"access_method":null,"num_upcoming_events":104,"address":"109 Eastlake Avenue East","capacity":800,"slug":"el-corazon","name":"El Corazon","url":"https://seatgeek.com/venues/el-corazon/tickets","country":"US","popularity":0,"name_v2":"El Corazon"},"performers":[{"name":"Vibe","image":"https://seatgeek.com/images/performers-landscape/vibe-b7a0fe/45555/huge.jpg"},{"name":"S.U.S.","image":"https://seatgeek.com/images/performers-landscape/s-u-s-0c53e0/704841/huge.jpg"}]},{"title":"JD McPherson (21+)","url":"https://seatgeek.com/jd-mcpherson-21-tickets/seattle-washington-tractor-tavern-2019-04-05-9-pm/concert/4725366","datetime_local":"2019-04-05T21:00:00","venue":{"links":[],"metro_code":819,"postal_code":"98107","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":722,"city":"Seattle","extended_address":"Seattle, WA 98107","display_location":"Seattle, WA","state":"WA","score":0.40448612,"location":{"lat":47.6657,"lon":-122.383},"access_method":null,"num_upcoming_events":16,"address":"5213 Ballard Ave NW","capacity":400,"slug":"tractor-tavern","name":"Tractor Tavern","url":"https://seatgeek.com/venues/tractor-tavern/tickets","country":"US","popularity":0,"name_v2":"Tractor Tavern"},"performers":[{"name":"JD McPherson","image":"https://seatgeek.com/images/performers-landscape/jd-mcpherson-aa1be3/10323/15341/huge.jpg"}]},{"title":"JD McPherson (21+)","url":"https://seatgeek.com/jd-mcpherson-21-tickets/seattle-washington-tractor-tavern-2019-04-06-9-pm/concert/4725369","datetime_local":"2019-04-06T21:00:00","venue":{"links":[],"metro_code":819,"postal_code":"98107","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":722,"city":"Seattle","extended_address":"Seattle, WA 98107","display_location":"Seattle, WA","state":"WA","score":0.40448612,"location":{"lat":47.6657,"lon":-122.383},"access_method":null,"num_upcoming_events":16,"address":"5213 Ballard Ave NW","capacity":400,"slug":"tractor-tavern","name":"Tractor Tavern","url":"https://seatgeek.com/venues/tractor-tavern/tickets","country":"US","popularity":0,"name_v2":"Tractor Tavern"},"performers":[{"name":"JD McPherson","image":"https://seatgeek.com/images/performers-landscape/jd-mcpherson-4a9063/10323/huge.jpg"}]},{"title":"Hop Along","url":"https://seatgeek.com/hop-along-tickets/seattle-washington-neptune-theatre-2019-04-06-9-pm/concert/4708684","datetime_local":"2019-04-06T21:00:00","venue":{"links":[],"metro_code":819,"postal_code":"98105","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":5805,"city":"Seattle","extended_address":"Seattle, WA 98105","display_location":"Seattle, WA","state":"WA","score":0.5249145,"location":{"lat":47.6613,"lon":-122.314},"access_method":null,"num_upcoming_events":34,"address":"1303 Northeast 45th Street","capacity":479,"slug":"neptune-theatre","name":"Neptune Theatre","url":"https://seatgeek.com/venues/neptune-theatre/tickets","country":"US","popularity":0,"name_v2":"Neptune Theatre"},"performers":[{"name":"Hop Along","image":"https://seatgeek.com/images/performers-landscape/hop-along-132f2b/17969/huge.jpg"}]},{"title":"The Movielife (21+)","url":"https://seatgeek.com/the-movielife-21-tickets/seattle-washington-sunset-tavern-2019-04-06-9-pm/concert/4676903","datetime_local":"2019-04-06T21:00:00","venue":{"links":[],"metro_code":819,"postal_code":"98107","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":9955,"city":"Seattle","extended_address":"Seattle, WA 98107","display_location":"Seattle, WA","state":"WA","score":0.4112299,"location":{"lat":47.6681,"lon":-122.386},"access_method":null,"num_upcoming_events":14,"address":"5433 Ballard Ave NW","capacity":0,"slug":"sunset-tavern","name":"Sunset Tavern","url":"https://seatgeek.com/venues/sunset-tavern/tickets","country":"US","popularity":0,"name_v2":"Sunset Tavern"},"performers":[{"name":"The Movielife","image":"https://seatgeek.com/images/performers-landscape/the-movielife-af24bf/10693/21734/huge.jpg"}]},{"title":"Jermaine Elliott","url":"https://seatgeek.com/jermaine-elliott-tickets/seattle-washington-el-corazon-2019-04-07-7-30-pm/concert/4743685","datetime_local":"2019-04-07T19:30:00","venue":{"links":[],"metro_code":819,"postal_code":"98109","timezone":"America/Los_Angeles","has_upcoming_events":true,"id":1178,"city":"Seattle","extended_address":"Seattle, WA 98109","display_location":"Seattle, WA","state":"WA","score":0.41065976,"location":{"lat":47.6188,"lon":-122.329},"access_method":null,"num_upcoming_events":101,"address":"109 Eastlake Avenue East","capacity":800,"slug":"el-corazon","name":"El Corazon","url":"https://seatgeek.com/venues/el-corazon/tickets","country":"US","popularity":0,"name_v2":"El Corazon"},"performers":[{"name":"Jermaine Elliott","image":"https://seatgeek.com/images/performers-landscape/jermaine-elliott-258793/701725/huge.jpg"}]}]}`),

    videoRequest: null,
    videoResponse: null,
    //videoResponse: JSON.parse(`{"videos":{"Tommy Genesis":["o77coh1WnYA", "tWwHmNhYaFg"]}}`),
  }

  componentDidMount() {
    const width = Number(document.body.clientWidth);
    const height = Math.min(width / VIDEO_ASPECT_RATIO, VIDEO_MAX_HEIGHT);
    this.setState({videoHeight: (height + VIDEO_CONTROL_HEIGHT)});
  }

  get today() {
    return this.daysFromToday(0);
  }

  daysFromToday(count: number) {
    return moment().add(count, 'days').format(YMD_FORMAT);
  }

  get uniquePerformerNames() {
    const performers = [];
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

  get allVideoIds() {
    const {videoResponse} = this.state;
    const ids = [];
    for (let performer in videoResponse.videos) {
      const videos = videoResponse.videos[performer];
      for (let videoId of videos) {
        ids.push(videoId);
      }
    }
    return ids;
  }

  render() {
    const {dateType, eventRequest, videoHeight} = this.state;
    let mainStyle = null;
    if (this.state.videoId) {
      mainStyle = {marginBottom: videoHeight};
    }

    return (<div>
      <div style={mainStyle}>
        <header>
          <h1>On Tonight</h1>
          <div className="options">
            <DatePicker dateType={dateType}
              onDateChange={this.handleDateChange} />
            <PlacePicker postalCode={eventRequest.postal_code}
              onPlaceChange={this.handlePlaceChange} />
            <TextField
              style={{width: 30}}
              label="radius"
              value={eventRequest.radius}
              onChange={this.handleRadiusChange}
              type="number"
            />
          </div>
        </header>

        {this.renderEvents()}

        <div className="actions">
          <Button variant="contained" color="primary" onClick={this.handleShuffle}>
            Shuffle All
            <Icon>shuffle</Icon>
          </Button>
        </div>
      </div>

      {this.renderVideoPlayer()}
    </div>);
  }

  private renderEvents() {
    const {eventResponse} = this.state;
    if (!eventResponse) {
      return null;
    }
    console.log(`Rendering ${eventResponse.events.length} events.`);
    const events = this.state.eventResponse.events.map((event, ind) => {
      // See if we have any videos loaded for performers involved in this event.
      const videos = this.getEventVideos(event);
      return (
        <EventItem event={event} videos={videos} key={ind}
          onPlayVideo={this.handlePlayVideo}/>
      )
    });
    return (<div>
      {events}
    </div>);
  }

  private renderVideoPlayer() {
    const {videoHeight, videoId} = this.state;
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
    if (this.state.shuffling) {
      this.nextRandom();
    }
  }

  private setVideoTitle(event) {
    const data = event.target.getVideoData();
    this.setState({
      videoTitle: data.title,
    });
  }

  private handlePlaceChange = (postalCode: string) => {
    localStorage.postalCode = postalCode;
    this.setState({
      eventRequest: {
        ...this.state.eventRequest,
        postal_code: postalCode,
      }
    });
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
    this.setState({videoId: null, shuffling: false});
  }

  private handleNextVideo = () => {
    this.nextRandom();
  }

  private getEventVideos(event: Event): string[] {
    const {videoResponse} = this.state;
    const videos = [];
    if (!videoResponse) {
      return videos;
    }

    // Look up video for each performer.
    for (let perf of event.performers) {
      const {name} = perf;
      const perfVideos = videoResponse.videos[name];
      if (perfVideos) {
        for (let video of perfVideos) {
          videos.push(video);
        }
      }
    }
    return videos;
  }

  private async updateEvents() {
    this.setState({loading: true});
    const eventResponse: EventResponse = await this.makeEventRequest(this.state.eventRequest);
    console.log('eventResponse', eventResponse);
    this.setState({eventResponse, loading: false});

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

  private handleShuffle = () => {
    // If we're not already playing back, pick a random video to play.
    if (!this.state.videoId) {
      this.nextRandom();
    }

    this.setState({
      shuffling: true,
    });
  }

  private nextRandom() {
    // Pick a random video to play.
    let videoId = this.state.videoId;
    while (videoId == this.state.videoId) {
      videoId = pickRandom(this.allVideoIds);
    }
    this.setState({videoId});
  }

  private handlePlayVideo = (video: string) => {
    // A specific video was selected to play.
    console.log('handlePlayVideo', video);
    this.setState({videoId: video, videoTitle: null, shuffling: false});
  }


  /*** DATA ACQUISITION ***/
private async makeEventRequest(eventRequest: EventRequest): Promise<EventResponse> {
    console.log('eventRequest', eventRequest);
    const {radius, postal_code, start_date, end_date} = eventRequest;
    const url = `${API_ROOT}/listLiveMusicNearby?radius=${radius}&postal_code=${postal_code}&start_date=${start_date}&end_date=${end_date}`;
    const res = await fetch(url);
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
