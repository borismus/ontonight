import * as React from 'react';
import YouTube from 'react-youtube';

export const About: React.StatelessComponent<{}> = () => {
  function handleVideoReady(event) {
    //event.target.playVideo();
  }

  return (<div>
    <YouTube videoId="0TshsSR725s" onReady={handleVideoReady} />
  </div>);
}
