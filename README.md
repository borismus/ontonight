Live Music Preview / On Tonight
===

Some cities, like Seattle, have a vibrant live music scene. However it can often
be hard to navigate existing sites like The Stranger and SongKick. [What I really
want](https://twitter.com/borismus/status/1065412031463927810) is, for a given
day, week or weekend, to preview the bands that are playing nearby, and decide
if I like one enough to go hear it. This project is a mashup between an existing
service that enumerates upcoming bands and their schedules (eg. SongKick),
another service that allows you to listen to a bunch of bands (eg. YouTube), and
potentially a metadata service that gives you additional information about the
band, like genre (eg. MusicBrainz).

The ultimate result is a mobile-friendly website that lets you search for bands
playing nearby and at a certain time, and either 

1. Quickly preview bands that are appealing, or
2. Shuffle all bands matching the criteria, keeping the tab open in the
   background


# Implementation

Open source.

React + TS + Firebase.

Firebase functions to call the SongKick API, filter results and return them.

    listLiveMusicNearby

    Request {
      zip: number
      radius: number
    }
    Response {[
      {
        artist: "Moon Hooch"
        venue: "Nectar Lounge",
        location: {
          city: "Seattle, WA, US",
          lng: -122.4332937,
          lat: 37.7842398
        }
        datetime: "2019-03-05T20:00:00-0800",
      },
      ...
    ]}

Firebase functions to find the best band videos on YouTube.

    listVideosForArtist

    Request {
      artist: string
    }
    Response {
      videos: [
        "https://www.youtube.com/watch?v=OCie4XtSdqA",
        "https://www.youtube.com/watch?v=PB8g1h152bQ",
      ]
    }

And, of course, the front-end itself that lets you do the things in a pleasant,
simple user interface.

Does this work well in practice? Let's think this through for just a second.
Suppose I search for 98103 with a 5 mile radius. I get the event listing by
calling listLiveMusicNearby, then for each artist, get a list of videos by
calling listVideosForArtist. I load the YouTube IFrame Player API to be able to
play selected videos. This enables playback of specific videos, and also
shuffling through all of the search results.

Let's see how slow each of the steps here is before optimizing and caching. But
since we use Firebase Functions we can easily cache everything in a Firebase
database.
