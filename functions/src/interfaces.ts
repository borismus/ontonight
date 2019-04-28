export interface Performer {
  name: string;
  image: string;
}

export interface LatLon {
  lat: number;
  lon: number;
}

export interface Venue {
  city: string;
  name: string;
  location: LatLon;
}

export interface Event {
  // The following fields are copied verbatim from the events response.
  // (from https://platform.seatgeek.com/)
  id: number;
  title: string;
  url: string;
  datetime_local: string;
  performers: Performer[];
  venue: Venue;
}

export interface EventRequest {
  radius: number;
  postal_code: string;
  // Start and end date are strings in YYYY-MM-DD format.
  start_date: string;
  end_date: string;
}

export interface EventResponse {
  events?: Event[];
  error?: string;
}

export interface PerformerVideo {
  performer_name: string;
  video_title: string;
  video_id: string;
}

export interface VideoRequest {
  performer_names: string[];
}

export interface VideoResponse {
  videos: {[key: string]: string[]};
}
