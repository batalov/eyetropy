const eyetropy = require('./index');

async function test() {
  // const input = '/Users/alexeybatalov/Downloads/soviet_bus_stops_20s.mp4';
  const input = 'rtsp://ceres.stand.hp:36484/mystream';
  console.log(
    JSON.stringify(
      await eyetropy(
        input,
        {
          extractFrames: {
            diffImg: true,
          },
        },
        {
          timeLength: 2,
          imgDiff: {
            originalImageDir:
              '/Users/alexeybatalov/WebstormProjects/InOne-Integration-API-Tests/data/videoMonitoring/sovietBusStopsTestVideo/frames/',
          },
          imgCropper: {
            rectangle: {
              type: 'bottom-left',
            },
          },
        },
      ),
      null,
      ' ',
    ),
  );
}

test();
