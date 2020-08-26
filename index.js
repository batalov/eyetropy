const log = require('loglevel');
const fs = require('fs');
const graphicsMagick = require('gm');
const bluebird = require('bluebird');
const vibrant = require('node-vibrant');
const path = require('path');

const tf = require('./src/tensorFlow');

const validateConfig = require('./src/configValidator');
const validateOptions = require('./src/optionsValidator');

const { evaluateEntropy } = require('./src/imageEntropy');
const { diffImg, findImageByFrameNumber } = require('./src/imgDiff');

const { cfg } = require('./config/config');

const { makeDir, cleanUpDir, setLogLevel, removeDir } = require('./src/utils');

const {
  getMetaData,
  getVmafMotionAvg,
  splitVideoIntoImages,
  detectBlack,
  detectFreeze,
  measureBitplaneNoise,
  detectSilence,
  measureEntropy,
} = require('./src/ffmpeg');

const { cropAndNormalizeImage } = require('./src/cropper');
const { imgNumberOcr } = require('./src/imgNumberOCR');

const eyetropy = async function(input, options, config, logLevel) {
  try {
    setLogLevel(logLevel);
    await validateOptions(options);
    await validateConfig(config);
    const conf = await prepareConfig(config);

    const results = await launch(input, options, conf);

    return results;
  } catch (e) {
    log.error(`Error:\n${e.message}`);
    throw e;
  }
};

async function launch(input, options, config) {
  // if options empty or not passed return metadata
  if (options == null || (options.constructor === Object && Object.entries(options).length === 0)) {
    return { metaData: await getMetaData(input) };
  }

  const methods = Array(8).fill('init');
  const propertyNameDict = {
    0: 'metaData',
    1: 'vmafMotionAvg',
    2: 'blackParts',
    3: 'freezeParts',
    4: 'silentParts',
    5: 'bitplaneNoise',
    6: 'entropy',
    7: 'extractedFrames',
  };

  const ffmpegOptions = {
    timeLength: config.timeLength,
  };

  if (config.frameRate) {
    ffmpegOptions.frameRate = config.frameRate;
  }

  if (options.metaData) {
    methods[0] = getMetaData(input);
  }

  if (options.vmafMotionAvg) {
    methods[1] = getVmafMotionAvg(input, ffmpegOptions);
  }

  if (options.detectBlackness) {
    methods[2] = detectBlack(input, ffmpegOptions);
  }

  if (options.detectFreezes) {
    methods[3] = detectFreeze(input, ffmpegOptions);
  }

  if (options.detectSilentParts) {
    methods[4] = detectSilence(input, ffmpegOptions);
  }

  if (options.measureBitplaneNoise) {
    methods[5] = measureBitplaneNoise(input, ffmpegOptions);
  }

  if (options.measureEntropy) {
    methods[6] = measureEntropy(input, ffmpegOptions);
  }

  if (options.extractFrames) {
    methods[7] = handleFrameExtraction(input, options, config);
  }

  const output = await bluebird.Promise.all(methods);

  const results = {};
  output.forEach((value, index) => {
    if (value !== 'init') {
      results[propertyNameDict[index]] = value;
    }
  });

  if (fs.existsSync(config.frameExtractionTempDir)) {
    await removeDir(config.frameExtractionTempDir);
  }

  if (fs.existsSync(config.imgNumberOcrTempDir)) {
    await removeDir(config.imgNumberOcrTempDir);
  }

  return results;
}

async function prepareConfig(config) {
  const output = cfg;
  if (config && config.constructor === Object && Object.entries(config).length > 0) {
    for (const key in config) {
      if (config.hasOwnProperty(key)) output[key] = config[key];
    }
  }
  return output;
}

async function labelImg(input, config) {
  await cropAndNormalizeImage(input, config);
  return imgNumberOcr(input, config);
}

async function handleFrameExtraction(input, options, config) {
  if (fs.existsSync(config.frameExtractionTempDir)) {
    await cleanUpDir(config.frameExtractionTempDir);
  } else {
    await makeDir(config.frameExtractionTempDir);
  }

  const splitImageOptions = {
    timeLength: config.timeLength,
    imageExtension: config.splitImages.imageExtension,
  };

  if (config.frameRate) {
    splitImageOptions.frameRate = config.frameRate;
  }

  await splitVideoIntoImages(input, splitImageOptions);

  if (fs.existsSync(config.imgNumberOcrTempDir)) {
    await cleanUpDir(config.imgNumberOcrTempDir);
  }

  if ((options.extractFrames.classifyObjects || options.extractFrames.diffImg) && config.imgCropper) {
    await makeDir(config.imgNumberOcrTempDir);
  }

  if (options.extractFrames.classifyObjects) {
    await tf.load(config);
  }

  const files = fs.readdirSync(config.frameExtractionTempDir);

  const results = await bluebird.Promise.all(
    files.map(async img => {
      const imgPath = path.join(config.frameExtractionTempDir, img);
      const frameOperations = Array(6).fill('init');
      const framePropertyNameDict = {
        0: 'frameOcrNumber',
        1: 'classificationResults',
        2: 'diffResults',
        3: 'imgMetaData',
        4: 'imgDominantColours',
        5: 'imgEntropy',
      };

      if ((options.extractFrames.classifyObjects || options.extractFrames.diffImg) && config.imgCropper) {
        frameOperations[0] = await labelImg(imgPath, config);
        if (config.imgNumberOcr.stripNonDigits || !config.imgNumberOcr.stripNonDigits) {
          frameOperations[0] = frameOperations[0].replace(/\D/g, '');
        }
      }

      if (options.extractFrames.classifyObjects) {
        frameOperations[1] = tf.classify(imgPath, config);
      }

      if (options.extractFrames.diffImg) {
        if (!config.imgCropper) {
          throw Error(`${cfg.logLabel.frameExtractionHandler}}: missing imgCropper config param`);
        }
        if (config.imgDiff && config.imgDiff.originalImageDir) {
          const originalImage = await findImageByFrameNumber(config.imgDiff.originalImageDir, frameOperations[0]);
          if (originalImage === null) {
            frameOperations[2] = null;
          } else {
            frameOperations[2] = diffImg(originalImage, imgPath);
          }
        }
      }

      if (options.extractFrames.imgMetaData) {
        const gm = bluebird.promisifyAll(graphicsMagick(imgPath));
        frameOperations[3] = gm.identifyAsync();
      }

      if (options.extractFrames.imgDominantColours) {
        frameOperations[4] = vibrant.from(imgPath).getPalette();
      }

      if (options.extractFrames.imgEntropy) {
        frameOperations[5] = evaluateEntropy(imgPath);
      }

      const output = await bluebird.Promise.all(frameOperations);

      const frameData = {};
      output.forEach((value, index) => {
        if (value !== 'init') {
          frameData[framePropertyNameDict[index]] = value;
        }
      });
      return frameData;
    }),
  );
  return results;
}

module.exports = eyetropy;
