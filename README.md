# eyetropy
**This package is aimed at testing streaming video purposes. 
You can get some important information about video file or stream such as:**

* **Basic meta data like codec name/format, video resolution/aspect ratio etc.**
* **Video VMAF Motion Average value, which describes how much motion is present in the video 
and the video quality as perceived by human**
* **Video fragments, containing blackness**
* **Video fragments, containing freezes**
* **Video fragments, containing silence (audiowise)**
* **Average and per frame greyscale entropy**
* **Average and per frame bitplane noise**
* **Per frame objects identified by TensorFlow machine learning model**

## Installation
```npm install eyetropy```

## The Idea
The whole concept of this package is to provide decent metrics (from simple meta data to more 
complex metrics) for testing video files or streams. You can use the VMAF Motion Average 
value to identify how much motion happens in the video as well as the perceived quality of it.
Additionally you can detect silence, black/freeze periods on your input file/stream. Besides 
with entropy value you can get an amount of information on the input and with bitplane noise 
measurement detect the bitplane noise. Combined with the machine learning algorithm, 
which identifies objects on each video frame, you can have a nice combination of means to get a solid
foundation capable of telling if your video file or stream is working as expected with no black
screen/noise, unwanted artifacts or other unexpected things. 

## Basic Usage
```js
    const {eyetropy} = require('eyetropy');
    
    // get meta data for input source of rtsp stream
    eyetropy.analyze('rtsp://your-value/');
    
    //get meta data and VMAF Motion Average for input source of a .mp4 file
    eyetropy.analyze('/Users/yourUser/Documents/test.mp4', {vmafMotionAvg: true, metaData: true});
    
    /* get meta data, VMAF Motion Average, detect black/freeze/silent periods,
     * measure bitplane noise/entropy, classify objects for input source of a m3u playlist
     * pass log level 'info'
     * pass config object, setting time length in seconds and frame rate (frame per second)
     * for the video segmenting
     */
    eyetropy.analyze('https://coolcam.probably/hls/camera12_2.m3u8',
                    {vmafMotionAvg: true, 
                     metaData: true,
                     detectBlackness: true,
                     detectFreezes: true,
                     detectSilentPeriods: true,
                     measureBitplaneNoise: true,
                     measureEntropy: true,
                     classifyObjects: true},
                    {vmafMotionAvg: {
                      timeLength: 7
                    },
                     detectBlackness: {
                       timeLength: 7
                    },
                     detectFreezes: {
                       timeLength: 7
                    },
                     detectSilentPeriods: {
                       timeLength: 7
                    },
                     entropy: {
                       frameRate: '3/1',
                       timeLength: 7
                    },
                     bitplaneNoise: {
                       frameRate: '3/1',
                       timeLength: 7
                    },
                     splitImages: {
                       frameRate: '3/1',
                       timeLength: 7
                    },
                    },
                    'info');
```

## General Notes
* Bare in mind that increasing values of frame rate and time length properties also increase 
the overall time required for execution
* If your goal is testing some service with video processing, the best practice would be
to prepare some video file or stream with known expected test values
* In terms of interpretation of VMAF Motion Average score i would recommend reading related 
articles in the Additional Information
* Entropy metric is quite reliable in detecting how much information is on the video, but 
the thing to consider is that it will show a high value for white noise
* Bitplane noise metric can be quite useful to get the colour info
* The input (file/stream uri, options/config/logLevel params) to this module gets through 
a strict validation process

## Additional Information
* VMAF by Netflix: https://medium.com/netflix-techblog/toward-a-practical-perceptual-video-quality-metric-653f208b9652
https://medium.com/netflix-techblog/vmaf-the-journey-continues-44b51ee9ed12
* ffmpeg documenation: https://ffmpeg.org/ffmpeg-all.html
* Basic TensorFlow node implementation: http://jamesthom.as/blog/2018/08/07/machine-learning-in-node-dot-js-with-tensorflow-dot-js/
* https://www.tensorflow.org/js
* TensorFlow js models: https://github.com/tensorflow/tfjs-models
* Work on image integrity: https://pdfs.semanticscholar.org/f58b/216a76718854345b0f70637b14da6a1888cc.pdf?_ga=2.44905700.1550178958.1558516626-1913169076.1558516626
* Grayscale entropy: https://stats.stackexchange.com/questions/235270/entropy-of-an-image
