export interface SamplePreset {
  id: string;
  title: string;
  description: string;
  badge: string;
  content: string;
}

export const SAMPLE_PLAYLISTS: SamplePreset[] = [
  {
    id: 'demo-streams',
    title: 'Featured Cinema & Live Test Streams',
    description: 'High-definition HLS & MP4 reference streams with metadata, logos, and categories',
    badge: 'Recommended',
    content: `#EXTM3U
#EXTINF:-1 tvg-id="bbb-hls" tvg-name="Big Buck Bunny" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/320px-Big_buck_bunny_poster_big.jpg" group-title="Animation",Big Buck Bunny (1080p HLS)
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

#EXTINF:-1 tvg-id="sintel-hls" tvg-name="Sintel" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sintel_poster.jpg/320px-Sintel_poster.jpg" group-title="Animation",Sintel 4K Multi-Audio HLS
https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8

#EXTINF:-1 tvg-id="tears-of-steel" tvg-name="Tears of Steel" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Tears_of_Steel_poster.jpg/320px-Tears_of_Steel_poster.jpg" group-title="Sci-Fi & Action",Tears of Steel (VFX Demo)
https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8

#EXTINF:-1 tvg-id="apple-bipbop" tvg-name="Apple BipBop" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png" group-title="Tech & Testing",Apple Advanced BipBop (16x9 HLS)
https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8

#EXTINF:-1 tvg-id="elephants-dream" tvg-name="Elephants Dream" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Elephants_Dream_poster.jpg/320px-Elephants_Dream_poster.jpg" group-title="Animation",Elephants Dream (Open Movie)
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4

#EXTINF:-1 tvg-id="for-bigger-blazes" tvg-name="For Bigger Blazes" tvg-logo="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg" group-title="Documentary",For Bigger Blazes (Nature Ultra HD)
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4

#EXTINF:-1 tvg-id="we-are-going-on-bullrun" tvg-name="Bullrun Adventure" tvg-logo="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WeAreGoingOnBullrun.jpg" group-title="Sports & Auto",Bullrun Extreme Rally HD
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4

#EXTINF:-1 tvg-id="subaru-outback" tvg-name="Subaru Outback" tvg-logo="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg" group-title="Sports & Auto",Subaru All-Terrain Showcase
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4
`,
  },
  {
    id: 'world-broadcast',
    title: 'Global News & Space Science',
    description: 'Public broadcast feeds and scientific space exploration streams',
    badge: 'Live Feeds',
    content: `#EXTM3U
#EXTINF:-1 tvg-id="nasa-tv-live" tvg-name="NASA TV" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/300px-NASA_logo.svg.png" group-title="Science & Space",NASA TV Public Channel (HD Live)
https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8

#EXTINF:-1 tvg-id="dw-english" tvg-name="DW English" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_symbol_2012.svg/300px-Deutsche_Welle_symbol_2012.svg.png" group-title="Global News",DW News English (24/7 Live Stream)
https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8

#EXTINF:-1 tvg-id="france24-en" tvg-name="France 24 English" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/France_24_logo_2013.svg/300px-France_24_logo_2013.svg.png" group-title="Global News",France 24 English Live Stream
https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8

#EXTINF:-1 tvg-id="redbull-tv" tvg-name="Red Bull TV" tvg-logo="https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_TV_logo.svg/320px-Red_Bull_TV_logo.svg.png" group-title="Action Sports",Red Bull TV Live Channel
https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8

#EXTINF:-1 tvg-id="esa-space" tvg-name="ESA Broadcast" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/ESA_logo.svg/300px-ESA_logo.svg.png" group-title="Science & Space",European Space Agency Live Stream
https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8
`,
  },
  {
    id: 'minimal-url-list',
    title: 'Clean URL Raw Playlist',
    description: 'Standard basic M3U with minimal headers to demonstrate URL normalization',
    badge: 'Raw Format',
    content: `#EXTM3U
#EXTINF:0,Tears of Steel HD
https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8
#EXTINF:0,Big Buck Bunny Multi-Bitrate
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
#EXTINF:0,For Bigger Escape Documentary
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4
#EXTINF:0,For Bigger Fun
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4
#EXTINF:0,Chromecast Visual Joy
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4
`,
  },
];
