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
    eyetropy('rtsp://your-value/');
    
    //get meta data and VMAF Motion Average for input source of a .mp4 file
    eyetropy('/Users/yourUser/Documents/test.mp4', {vmafMotionAvg: true, metaData: true});
    
    /* get meta data, VMAF Motion Average, detect black/freeze/silent periods,
     * measure bitplane noise/entropy, classify objects for input source of a m3u playlist
     * pass log level 'info'
     * pass config object, setting time length in seconds and frame rate (frame per second)
     * for the video segmenting
     */
    eyetropy('https://coolcam.probably/hls/camera12_2.m3u8',
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
Output example:
```
{
  "classificationResults": [
    {
      "frame": "1",
      "classifiedObjects": [
        {
          "className": "lampshade, lamp shade",
          "probability": 0.39289921522140503
        },
        {
          "className": "coil, spiral, volute, whorl, helix",
          "probability": 0.07808805257081985
        },
        {
          "className": "basketball",
          "probability": 0.07187622785568237
        }
      ]
    },
    {
      "frame": "2",
      "classifiedObjects": [
        {
          "className": "chain",
          "probability": 0.10306758433580399
        },
        {
          "className": "knot",
          "probability": 0.09443259239196777
        },
        {
          "className": "dial telephone, dial phone",
          "probability": 0.09123830497264862
        }
      ]
    },
  ],
  "metaData": {
    "streams": [
      {
        "index": 0,
        "codec_name": "mpeg4",
        "codec_long_name": "MPEG-4 part 2",
        "profile": "Simple Profile",
        "codec_type": "video",
        "codec_time_base": "1001/24000",
        "codec_tag_string": "mp4v",
        "codec_tag": "0x7634706d",
        "width": 1280,
        "height": 720,
        "coded_width": 1280,
        "coded_height": 720,
        "has_b_frames": 0,
        "sample_aspect_ratio": "1:1",
        "display_aspect_ratio": "16:9",
        "pix_fmt": "yuv420p",
        "level": 1,
        "color_range": "unknown",
        "color_space": "unknown",
        "color_transfer": "unknown",
        "color_primaries": "unknown",
        "chroma_location": "left",
        "field_order": "unknown",
        "timecode": "N/A",
        "refs": 1,
        "quarter_sample": "false",
        "divx_packed": "false",
        "id": "N/A",
        "r_frame_rate": "24000/1001",
        "avg_frame_rate": "24000/1001",
        "time_base": "1/24000",
        "start_pts": 0,
        "start_time": 0,
        "duration_ts": 233233,
        "duration": 9.718042,
        "bit_rate": 1128420,
        "max_bit_rate": 1128420,
        "bits_per_raw_sample": "N/A",
        "nb_frames": 233,
        "nb_read_frames": "N/A",
        "nb_read_packets": "N/A",
        "tags": {
          "language": "und",
          "handler_name": "Core Media Video"
        },
        "disposition": {
          "default": 1,
          "dub": 0,
          "original": 0,
          "comment": 0,
          "lyrics": 0,
          "karaoke": 0,
          "forced": 0,
          "hearing_impaired": 0,
          "visual_impaired": 0,
          "clean_effects": 0,
          "attached_pic": 0,
          "timed_thumbnails": 0
        }
      }
    ],
    "format": {
      "filename": "/somefile/file.mp4",
      "nb_streams": 1,
      "nb_programs": 0,
      "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
      "format_long_name": "QuickTime / MOV",
      "start_time": 0,
      "duration": 9.719,
      "size": 1372668,
      "bit_rate": 1129884,
      "probe_score": 100,
      "tags": {
        "major_brand": "isom",
        "minor_version": "512",
        "compatible_brands": "isomiso2mp41",
        "encoder": "Lavf58.20.100"
      }
    },
    "chapters": []
  },
  "vmafMotionAvg": 12.892,
  "blackPeriods": null,
  "freezePeriods": null,
  "silentPeriods": null,
  "bitplaneNoise": {
    "average": {
      "avgBitplaneNoise_O_1": 0.1552558,
      "avgBitplaneNoise_1_1": 0.14800319999999997,
      "avgBitplaneNoise_2_1": 0.11773940000000001
    },
    "output": [
      {
        "second": 0,
        "bitplaneNoise_O_1": 0.424067,
        "bitplaneNoise_1_1": 0.312656,
        "bitplaneNoise_2_1": 0.221675
      },
      {
        "second": 1,
        "bitplaneNoise_O_1": 0.072244,
        "bitplaneNoise_1_1": 0.103958,
        "bitplaneNoise_2_1": 0.08842
      }
      }
    ]
  },
  "entropy": {
    "average": {
      "avgEntropyNormal_Y": 5.430507,
      "avgNormalizedEntropy_Y": 0.6788131999999999,
      "avgEntropyNormal_U": 3.7568126,
      "avgNormalizedEntropy_U": 0.4696016,
      "avgEntropyNormal_V": 3.4184449999999997,
      "avgNormalizedEntropy_V": 0.42730560000000006
    },
    "output": [
      {
        "second": 0,
        "entropyNormal_Y": 6.471491,
        "normalizedEntropy_Y": 0.808936,
        "entropyNormal_U": 4.402239,
        "normalizedEntropy_U": 0.55028,
        "entropyNormal_V": 3.889918,
        "normalizedEntropy_V": 0.48624
      },
      {
        "second": 1,
        "entropyNormal_Y": 5.586614,
        "normalizedEntropy_Y": 0.698327,
        "entropyNormal_U": 4.07668,
        "normalizedEntropy_U": 0.509585,
        "entropyNormal_V": 3.640467,
        "normalizedEntropy_V": 0.455058
      }
    ]
  }
}
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
