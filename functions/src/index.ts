import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as zipcodes from 'zipcodes';
import * as fetch from 'node-fetch';

admin.initializeApp();

import {EventRequest, EventResponse, Event, LatLon, Performer, PerformerVideo, VideoRequest, VideoResponse} from './interfaces';

import {YOUTUBE_KEY_2 as YOUTUBE_KEY, SEATGEEK_CLIENT_ID, SONGKICK_KEY} from './secrets';

const YOUTUBE_ROOT = 'https://www.googleapis.com/youtube/v3';
const SEATGEEK_ROOT = 'https://api.seatgeek.com/2/';
const SONGKICK_ROOT = 'https://api.songkick.com/api/3.0';

const MAX_VIDEO_COUNT = 2;
const MUSIC_TOPIC = '/m/04rlf';

export const listLiveMusicNearby = functions.https.onRequest(async(request, response) => {
  // Enable cors.
  response.set('Access-Control-Allow-Origin', '*');

  const {radius, postal_code, start_date, end_date} = request.query;
  if (!radius) {
    response.status(500).send('Missing radius').end();
    return;
  }
  if (!postal_code) {
    response.status(500).send('Missing postal_code').end();
    return;
  }
  if (!start_date) {
    response.status(500).send('Missing start_date').end();
    return;
  }
  if (!end_date) {
    response.status(500).send('Missing end_date').end();
    return;
  }

  console.log(`listLiveMusicNearby: radius=${radius}, postal_code=${postal_code}
    start_date=${start_date}, end_date=${end_date}`);
  const dataRequest: EventRequest = {
    postal_code, radius, start_date, end_date
  }
  //const results = await fetchLiveMusicNearbySeatGeek(dataRequest)
  const results = await fetchLiveMusicNearbySongKick(dataRequest)
  response.send(results);
});


export const listVideosForPerformers = functions.https.onRequest(async (request, response) => {
  // Enable cors.
  response.set('Access-Control-Allow-Origin', '*');

  const {performers} = request.query;
  if (!performers) {
    response.status(500).send('Missing performers').end();
    return;
  }
  const perfNames = performers.split(',');
  const videos = {};
  for (const performer of perfNames) {
    console.log(`listVideosForPerformer: performer=${performer}.`);
    const performerVideos = await fetchCachedVideosForPerformer(performer);
    videos[performer] = performerVideos;
  }
  response.send({
    videos,
  });
});

async function fetchLiveMusicNearbySeatGeek(request: EventRequest) : Promise<EventResponse> {
  const {postal_code, radius, start_date, end_date} = request;

  const venues = await fetchNearbyVenues(postal_code, radius);
  const venueIds = venues.map(v => v.id);
  const venueNames = venues.map(v => v.name);
  console.log('venues', venueNames);

  const events = await fetchEventsAtVenues(venueIds, start_date, end_date);
  const eventNames = events.map(e => `${e.title} at ${e.venue.name}`);
  console.log('events', eventNames);

  return {
    events,
  };
}

async function fetchNearbyVenues(postal_code: string, radius: number): Promise<any[]> {
  // Get nearby venues.
  const count = 100;
  const url = `${SEATGEEK_ROOT}/venues?postal_code=${postal_code}&client_id=${SEATGEEK_CLIENT_ID}&per_page=${count}`;
  console.log('seatgeek url', url);
  const res = await fetch(url);
  const json = await res.json();

  // TODO: Filter list of venues by proximity to postal_code.
  const venues = [];
  for (const venue of json.venues) {
    const distance = zipcodes.distance(postal_code, venue.postal_code);
    if (distance < radius) {
      venues.push(venue);
    }
  }
  return venues;
}

async function fetchEventsAtVenues(venueIds: number[], start_date: string, end_date: string) : Promise<Event[]> {
  const count = 1000;
  const venueCsv = venueIds.map(id => String(id)).join(',');
  //console.log('venueCsv', venueCsv);
  const reqUrl = `${SEATGEEK_ROOT}/events?venue.id=${venueCsv}&client_id=${SEATGEEK_CLIENT_ID}&per_page=${count}&datetime_local.gte=${start_date}&datetime_local.lte=${end_date}`;
  //console.log(reqUrl);
  const res = await fetch(reqUrl);
  const json = await res.json();

  const events = [];
  for (const event of json.events) {
    const {title, url, datetime, venue, performers, type, id} = event;
    // Filter non-concerts.
    if (type !== 'concert') {
      continue;
    }

    const performersValid = performers.map(p => {
      const {name, image} = p;
      return {name, image};
    });
    const newEvent = {
      id, title, url, datetime, venue, performers: performersValid
    };
    events.push(newEvent);
  }
  return events;
}

async function fetchVideosForPerformer(performer: string) : Promise<PerformerVideo[]> {
  // Call YouTube API.
  const fields = encodeURIComponent('items/id,items/snippet/title');
  const url = `${YOUTUBE_ROOT}/search?part=snippet&q=${performer}&key=${YOUTUBE_KEY}&type=video&maxResults=${MAX_VIDEO_COUNT}&topicId=${MUSIC_TOPIC}&fields=${fields}`;

  /*
  // One day... cleaner.
  const params = new URLSearchParams();
  params.append('part', 'snippet');
  params.append('type', 'video');
  params.append('fields', fields);
  params.append('q', performer);
  params.append('key', YOUTUBE_KEY);
  params.append('topicId', MUSIC_TOPIC_ID);
  params.append('maxResults', MAX_VIDEO_COUNT);
  const url = `${YOUTUBE_ROOT}/search?${params.toString()}`;
  */
  console.log('youtube url', url);
  const res = await fetch(url);
  const json = await res.json();
  const videos = json.items;

  const out = [];
  for (const video of videos.slice(0, MAX_VIDEO_COUNT)) {
    const video_id = video.id.videoId;
    const video_title = video.snippet.title;
    out.push({
      video_id,
      video_title,
      performer_name: performer,
    });
  }
  return out;
}

async function fetchCachedVideosForPerformer(performer: string) {
  // Check for cached search results to avoid going to YouTube.
  const performerSafe = escape(performer.replace(/\./g, '%2E'));
  const cache = admin.database().ref('videos').child(performerSafe);
  const cachedVideos = (await cache.once('value')).val();

  if (cachedVideos) {
    return cachedVideos;
  }

  const videos = await fetchVideosForPerformer(performer);
  await cache.set(videos);
  return videos;
}

async function fetchLiveMusicNearbySongKick(request: EventRequest): Promise<EventResponse> {
  const {postal_code, radius, start_date, end_date} = request;
  // First look up the metro_area_id based on lat & lon, which we can get via
  // the zipcodes npm module.
  const {latitude, longitude} = zipcodes.lookup(postal_code.toUpperCase());
  const metro_area_id = await fetchSKMetroAreaId(latitude, longitude);

  // Next, look up all upcoming events for that metro area and filter it based
  // on the venue distance to the specified zip.
  const upcomingEvents = await fetchSKEventsForMetroArea(
    metro_area_id, start_date, end_date);

  const nearbyEvents = [];
  const loc: LatLon = {lat: latitude, lon: longitude};
  for (const event of upcomingEvents) {
    // Keep only events that are within the radius.
    const venueLoc: LatLon = {lat: event.location.lat, lon: event.location.lng};
    if (haversineDistance(loc, venueLoc) < radius) {
      const performers: Performer[] = event.performance.map(p => ({
        name: p.displayName,
        image: '',
      }));
      const venue = {
        city: event.location.city,
        name: event.venue.displayName,
        location: venueLoc,
      }
      const title = titleFromPerformers(performers);
      const newEvent: Event = {
        id: event.id,
        title,
        url: event.uri,
        datetime: event.start.datetime,
        date: event.start.date,
        performers,
        venue,
      };
      nearbyEvents.push(newEvent);
    }
  }
  const response = {
    events: nearbyEvents,
  }
  return response;
}

async function fetchSKMetroAreaId(lat: number, lon: number) {
  // TODO: Cache these results.
  const url = `${SONGKICK_ROOT}/search/locations.json?location=geo:${lat},${lon}&apikey=${SONGKICK_KEY}`;
  console.log('fetchSKMetroAreaId', url);
  const res = await fetch(url);
  const json = await res.json();
  const {resultsPage} = json;
  if (resultsPage.status !== 'ok') {
    console.error('Something went wrong.', json);
  }
  const location = resultsPage.results.location[0];
  return location.metroArea.id;
}

async function fetchSKEventsForMetroArea(metro_area_id: number, start_date: string, end_date: string) {
  const url = `${SONGKICK_ROOT}/metro_areas/${metro_area_id}/calendar.json?min_date=${start_date}&max_date=${end_date}&apikey=${SONGKICK_KEY}`;
  console.log('fetchSKEventsForMetroArea', url);
  const res = await fetch(url);
  const json = await res.json();
  const {resultsPage} = json;
  if (resultsPage.status !== 'ok') {
    console.error('Something went wrong.', json);
  }

  const events = resultsPage.results.event;
  return events;
}

// From https://stackoverflow.com/a/30316500/693934.
function haversineDistance(coords1: LatLon, coords2: LatLon, isMiles=true) {
  function toRad(x) {
    return x * Math.PI / 180;
  }

  const lon1 = coords1.lon;
  const lat1 = coords1.lat;

  const lon2 = coords2.lon;
  const lat2 = coords2.lat;

  const R = 6371; // km

  const x1 = lat2 - lat1;
  const dLat = toRad(x1);
  const x2 = lon2 - lon1;
  const dLon = toRad(x2)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;

  if (isMiles) {
    d /= 1.60934;
  }

  return d;
}

function titleFromPerformers(performers: Performer[]) {
  const names = performers.map(p => p.name);
  return oxfordComma(names);
}

function oxfordComma(words: string[]) {
  return words.slice(0, -2).join(', ') +
    (words.slice(0, -2).length ? ', ' : '') +
    words.slice(-2).join(' and ');
}
