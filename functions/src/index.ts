import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as zipcodes from 'zipcodes';
import * as fetch from 'node-fetch';

admin.initializeApp();

import {EventRequest, EventResponse, Event, VideoRequest, VideoResponse} from './interfaces';

import {YOUTUBE_KEY, SEATGEEK_CLIENT_ID} from './secrets';

const YOUTUBE_ROOT = 'https://www.googleapis.com/youtube/v3';
const SEATGEEK_ROOT = 'https://api.seatgeek.com/2/';
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
  const results = await fetchLiveMusicNearby(dataRequest)
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

async function fetchLiveMusicNearby(request: EventRequest) : Promise<EventResponse> {
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
    const {title, url, datetime_local, venue, performers, type, id} = event;
    // Filter non-concerts.
    if (type !== 'concert') {
      continue;
    }

    const performersValid = performers.map(p => {
      const {name, image} = p;
      return {name, image};
    });
    const newEvent = {
      id, title, url, datetime_local, venue, performers: performersValid
    };
    events.push(newEvent);
  }
  return events;
}

async function fetchVideosForPerformer(performer: string) : Promise<string[]> {
  // Call YouTube API.
  const url = `${YOUTUBE_ROOT}/search?part=snippet&q=${performer}&key=${YOUTUBE_KEY}&order=viewCount&type=video&maxResults=${MAX_VIDEO_COUNT}&topicId=${MUSIC_TOPIC}`;
  console.log('youtube url', url);
  const res = await fetch(url);
  const json = await res.json();
  const videos = json.items;

  const out = [];
  for (const video of videos.slice(0, MAX_VIDEO_COUNT)) {
    const id = video.id.videoId;
    out.push(id);
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
