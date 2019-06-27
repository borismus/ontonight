import * as EventEmitter from 'eventemitter3';
declare const MusicKit: any;

/**
 * Convenience wrappers around MusicKitJS:
 *
 * - List songs that are a representative set for an artist.
 * - Play representative song(s).
 * - Get album art for an artist (their top song).
 */

export class MusicPlayer extends EventEmitter {
  private music: any;
  private audio?: HTMLAudioElement;
  private songName?: string;

  constructor() {
    super();

    MusicKit.configure({
      developerToken: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkhUTUxBM01EWU4ifQ.eyJpYXQiOjE1NTk5NjA2NDcsImV4cCI6MTU3NTUxMjY0NywiaXNzIjoiUEJOWDVWRlYyUiJ9.2OmW3I2jKWIwsLsNOzY32uyWg8zx1CrIe6-FhCXrkOHHylrSbCjPDN74ex_FsoP0Wn4U9XvR10cBReQBQS2o0A',
      app: {
        name: 'On Tonight',
        build: '2019.6.10'
      }
    });
    this.music = MusicKit.getInstance();
    this.music.addEventListener('playbackProgressDidChange', (event) => {
      console.log('progress', event.progress);
    });
  }

  async playPreview(performerName: string) {
    this.stop();

    const results = await this.music.api.search(
      performerName, {limit: 1, types: 'songs'});
    const first = results.songs.data[0].attributes;
    this.songName = `${first.name} by ${first.artistName}`
    console.log(`Playing ${this.songName}.`);
    const previewSrc = first.previews[0].url;

    const audio = new Audio();
    audio.src = previewSrc;
    audio.play();
    this.audio = audio;
    this.audio.addEventListener('ended', () => this.emit('ended'));
  }

  stop() {
    delete this.songName;
    if (!this.audio) {
      return;
    }
    this.audio.pause();
  }

  getSongName() {
    return this.songName;
  }
}
