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
  private progressTimer?: number;

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
    this.audio = new Audio();
  }

  async playPreview(performerName: string) {
    // This strange order (setup audio first, load, then search for new song) is
    // required to circumvent very strict autoplay restrictions on iOS 11+.
    this.stop();
    const audio = new Audio();
    audio.src = '';
    audio.load();
    audio.addEventListener('ended', () => this.emit('ended'));
    this.audio = audio;

    const results = await this.music.api.search(
      performerName, {limit: 1, types: 'songs'});
    const first = results.songs.data[0].attributes;
    this.songName = `"${first.name}" by ${first.artistName}`;
    console.log(`Playing ${this.songName}.`);
    const previewSrc = first.previews[0].url;
    audio.src = previewSrc;

    await this.audio.play();
    this.progressTimer = setInterval(() => this.emitProgress(), 1000);
  }

  async play() {
    try {
    } catch (e) {
      console.log('Failed to play', e.name);
    }
  }

  stop() {
    delete this.songName;
    if (!this.audio) {
      return;
    }
    this.audio.pause();
    delete this.audio;
    clearInterval(this.progressTimer);
  }

  getSongName() {
    return this.songName;
  }

  private emitProgress() {
    if (!this.audio) {
      console.warn('emitProgress called but audio is undefined.');
      return;
    }
    const percent = this.audio.currentTime / this.audio.duration;
    this.emit('progress', percent);
  }
}
