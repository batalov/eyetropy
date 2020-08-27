# eyetropy
This package is aimed at testing (web) video services. 
You can get lots of data regarding video file or stream such as:

* Basic meta data like codec name/format, video resolution/aspect ratio etc.
* VMAF Motion Average value, which describes how much motion is present in the video 
and the video quality as perceived by human
* Video fragments containing black parts
* Video fragments containing freezes
* Video fragments containing silence (audiowise)
* Average and per frame greyscale entropy
* Average and per frame bitplane noise
* Frame extraction
* Per frame objects identified by TensorFlow machine learning model
* Per frame meta data, dominant colours, greyscale entropy
* Per frame diff to beforehand prepared images

## Dependencies
In order to be able to fully use eyetropy you'll need the following utilities installed on your machine:
* ffmpeg
* Tesseract
* GraphicsMagick
* node package @tensorflow/tfjs-node

### FFMPEG
* Installation guides https://github.com/adaptlearning/adapt_authoring/wiki/Installing-FFmpeg    
* You'll need a recent git build to have freezedetect included - get one from https://ffmpeg.zeranoe.com/builds/.
* Direct download link: https://ffmpeg.org/download.html
    
### Tesseract
https://github.com/tesseract-ocr/tesseract#installing-tesseract

### GraphicsMagick
https://github.com/aheckmann/gm#getting-started

### @tensorflow/tfjs-node
```
npm install @tensorflow/tfjs-node
```

## Eyetropy Installation
```
npm install eyetropy
```

## The Idea
The whole concept of this package is to provide decent metrics (from simple meta data to more 
complex ones) for testing video files or streams. You can use the VMAF Motion Average 
value to identify how much motion happens on the video as well as the perceived quality of it.
Additionally you can detect silence, black/freeze parts on your input file/stream. Besides, 
with entropy value you can get an amount of information on the input and with bitplane noise 
measurement detect the bitplane noise. Additionaly, it is possible to extract frames
and get per frame meta data, dominant colours, greyscale entropy or to diff frame to 
images prepared beforehand; combined with the machine learning algorithm, which identifies 
objects on each video frame, you can have a comprehensive combination of means to measure if 
your video file or stream is working as expected with no black screen/noise, 
unwanted artifacts or other unexpected things. 

## Usecase
Say you need to test a video streaming web service, more specifically your goal is to
automate testing process. The general algorithm would be to grab a piece of video -> label
each frame (draw a frame number on each frame) -> extract frames (to later use as diff images) -> 
run labelled video through the video service -> grab a video fragment after it's been 
processed by the service -> compare to expected values (meta data, entropy and so forth) 
or diff to beforehand prepared images using this module.

For video labelling see https://github.com/batalov/misc

## Basic Usage
```js
    const { eyetropy } = require('eyetropy');
    
    // get meta data for input source of rtsp stream
    eyetropy('rtsp://your-value/');
    
    //get meta data and VMAF Motion Average for input source of a .mp4 file
    eyetropy('/Users/yourUser/Documents/test.mp4', { vmafMotionAvg: true, metaData: true });
    
    /* get meta data, VMAF Motion Average, detect black/freeze/silent periods,
     * measure bitplane noise/entropy, extract frames for 5 second time period,
     * get per frame meta data, dominant colours, greyscale entropy;
     * diff frames to prepared images;
     * classify objects for each frame input source of a m3u playlist
     * pass log level 'info'
     * pass config object, setting time length in seconds and frame rate (frame per second)
     * for the video segmenting
     */ 
    eyetropy('https://coolcam.probably/hls/camera12_2.m3u8',
    { extractFrames: {
                    classifyObjects: true,
                    imgMetaData: true,
                    diffImg: true,
                    imgDominantColours: true,
                    imgEntropy: true
                },
                vmafMotionAvg: true,
                metaData: true,
                detectBlackness: true,
                detectFreezes: true,
                detectSilentParts: true,
                measureEntropy: true,
                measureBitplaneNoise: true,
            }, {
                frameRate: '1',
                timeLength: 5,
                imgDiff: {
                    originalImageDir: '/Users/usr/img', 
                },
                imgCropper: {
                    rectangle: {
                        type: 'bottom-left'
                    }
                },
                imgNumberOcr: {
                    lang: 'eng',
                    oem: 1,
                    psm: 6,
                    stripNonDigits: true
                },
                tensorFlow: {
                    numberOfChannels: 3,
                    model: 'mobilenet'
                },
                frameExtractionTempDir: '/Users/folk/Documents/frame_extraction_storage',
                imgNumberOcrTempDir: '/Users/folk/Documents/ocr_storage',
                cleanUpFrameExtractionTempDir: false,
                cleanUpImgNumberOcrTempDir: false,
            },
    'info');
```
Output example:
https://gist.github.com/batalov/cb788744a236e62b34d3798bf3a82570

Freeze/black/silent parts output:
https://gist.github.com/batalov/06bd549210cac746efcf670983eaf6d4

## Config options
You can configure a lot of options in the config object, passing it as third argument.

Config example:
https://gist.github.com/batalov/7a4da6d2e24fdf91a4bcfba594b8dbc5
### Config structure:
#### tensorFlow
* numberOfChannels - number of colour channels (default 3)
* model - tensorFlow model: either coco ssd or mobilenet (default mobilenet) 
#### frameRate
* number of fps (frame per second) for video source, use string format f/s e.g. '1/5' to extract 1 frame each 5 seconds
#### timeLength
* number of seconds during which video source will be processed by eyetropy
#### frameExtractionTempDir
* directory for frame extraction
#### imgNumberOcrTempDir
* directory for img ocr process; used for image ocr for further mapping of extracted and
prepared images
#### imgCropper
* configuration for cropping and image normalization process; used to crop, resize, normalize
image for further number ocr process
##### bwThreshold
* used to transform image to b-w colours http://sharp.pixelplumbing.com/en/stable/api-operation/#threshold
##### rectangle
Sets the cropping rectangle. Can be set to one of: top-left, bottom-left, bottom-right, top-right, custom; 
custom allows you set the dimensions of rectangle manually.
Default dimensions and coordinates of rectangle:
* width - 7% of image total width (Math.floor((imgMetaData.width / 100) * 7)
* height - 3% of image total height (Math.floor((imgMetaData.height / 100) * 3))
* top-left coordinates are top: 0, left: 0
* bottom-left coordinates are top: image total height - config.imgCropper.height, left: 0
* bottom-right coordinates are top: image total height - config.imgCropper.height, left: image total width - config.imgCropper.width
* top-right coordinates are top: 0, left: image total width - config.imgCropper.width
##### width
* sets the cropping rectangle width
##### height
* sets the cropping rectangle height
##### left
* sets the cropping rectangle x axis position
##### top
* sets the cropping rectangle y axis position
#### imgNumberOcr
Configures Tesseract OCR Engine
##### lang
* language (default eng)
##### oem
* Tesseract OCR Engine (default 1)
##### psm
* Tesseract OCR page segmentaion (default 6); https://github.com/tesseract-ocr/tesseract/wiki/ImproveQuality#page-segmentation-method
##### stripNonDigits
* Strips off all non digits (default true)
#### imgDiff
##### originalImageDir
* Sets the directory with images to diff with

## General Notes
* If your goal is testing some web service with video processing, the best practice 
would be to prepare video file (to use it as a stream later) with known expected 
test values. In my case image preparation included the following: i labeled each frame 
with a white rectangle, containing number of frame and then extracted frames with ffmpeg
* Frame labelling using ffmpeg
```bash
ffmpeg -i you_file.mp4 -vf "drawbox=x=0:y=690:w=70:h=100:color=white:t=fill","drawtext=fontfile=/path_to_font_directory/Arial.ttf:text=%{n}:fontcolor=black@1: x=5: y=700" output.mp4
``` 
* Frame extraction starting from zero
```bash
ffmpeg -i your_file.mp4 -start_number 0 -vf fps=25 -hide_banner ./your_directory/img/thumb%04d.png
```
* One of the most straightforward ways to ensure your video is working as expected is 
to diff extracted frames to previously prepared ones
* In order to be able to use diff image feature you would also need to set directory with
prepared images in the config and label each image with a corresponding number in the file name
 e.g. "thumb_0.png", "thumb0.png", "0.png". Diff feature expects that file name corresponds
 the number label on the image itself; note that png image format may not be suitable for image extraction due to compression
* In terms of interpretation of VMAF Motion Average score I would recommend reading related 
articles in the Additional Information
* Entropy metric is quite reliable in detecting how much information is on the video, but 
the thing to consider is that it will still calculate high value for white noise
* Bitplane noise metric can be quite useful for noise detection or to get the colour info
* The input (file/stream uri, options/config/logLevel params) to this module gets through 
a strict validation process
* Bare in mind that increasing values of frame rate and time length properties also increase 
the overall time required for execution

## Additional Information
* VMAF by Netflix: https://medium.com/netflix-techblog/toward-a-practical-perceptual-video-quality-metric-653f208b9652
https://medium.com/netflix-techblog/vmaf-the-journey-continues-44b51ee9ed12
* ffmpeg documenation: https://ffmpeg.org/ffmpeg-all.html
* Basic TensorFlow node implementation: http://jamesthom.as/blog/2018/08/07/machine-learning-in-node-dot-js-with-tensorflow-dot-js/
* https://www.tensorflow.org/js
* TensorFlow js models: https://github.com/tensorflow/tfjs-models
* Work on image integrity: https://pdfs.semanticscholar.org/f58b/216a76718854345b0f70637b14da6a1888cc.pdf?_ga=2.44905700.1550178958.1558516626-1913169076.1558516626
* Greyscale entropy: https://stats.stackexchange.com/questions/235270/entropy-of-an-image
* Tesseract OCR page segmentation https://github.com/tesseract-ocr/tesseract/wiki/ImproveQuality#page-segmentation-method
* Webdriver io implementation of screen capture of certain html element using ffmpeg
https://gist.github.com/batalov/3d465a9480a004acfb461648164f3e80 
* Video labelling examples https://github.com/batalov/misc

