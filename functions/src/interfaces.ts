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
  id: number;
  title: string;
  url: string;
  datetime: string;
  // Fallback in case datetime isn't specified.
  date: string;
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
