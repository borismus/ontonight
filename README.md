On Tonight
===

On an average evening in Seattle, you can walk along the center of Fremont,
Ballard, or Capitol Hill, and pass by countless live music venues bursting with
people pining to see some obscure and awesome indie musicians do their thing.

While wandering can be a good way of getting a good sense for what's up on a
particular night, it's often impractical as neighbourhoods are relatively far
apart, and time is limited. Sites like SongKick and SeatGeek do a good job of
listing upcoming events but don't give a preview of the performer's work.

[What I really want](https://twitter.com/borismus/status/1065412031463927810)
is to preview bands that coming to play nearby, and decide if I like one enough
to go hear it. This project is a mashup between an existing service that
enumerates upcoming bands and their schedules (eg. SongKick), another service
that allows you to listen to a bunch of bands (eg. YouTube), and potentially a
metadata service that gives you additional information about the band, like
genre (eg. MusicBrainz). The ultimate result is a mobile-friendly website that
lets you browse bands playing nearby, and in the near future. Two major use
cases:

1. Browse through a list of bands coming soon.
2. Use as a music player, shuffling through all of the music.


# Implementation

Open source.

React + TS + Firebase.

Firebase functions call an upcoming events API (eg. SongKick or SeatGeek),
filter results and return them.

    listLiveMusicNearby

    Request {
      zip: number
      radius: number
      start: number
      end: number
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

    listVideosForArtists

    Request {
      artists: "Radiohead,Ween"
    }
    Response {
      videos: {
        Radiohead: [
          "https://www.youtube.com/watch?v=OCie4XtSdqA",
          "https://www.youtube.com/watch?v=PB8g1h152bQ",
        ],
        Ween: [
          "https://www.youtube.com/watch?v=OCie4XtSdqB",
          "https://www.youtube.com/watch?v=PB8g1h152bR",
        ]
      }
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

---

Turns out YouTube API is pretty quota limited. We go to YouTube in order to get
videos for a given band. We can safely cache these results in Firebase since
they hardly ever change. This can be done on a per-artist basis:

/artist_videos/:artistName
{
  0: videoId,
  1: videoId,
  ...
}

So, before hitting the YouTube API, first check this firebase cache. If there's
something there, return those results. If there's nothing there, hit the YouTube
API, process, cache the results and return them.
