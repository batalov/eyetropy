const log = require('loglevel');
const fs = require('fs');
const graphicsMagick = require('gm');
const bluebird = require('bluebird');
const vibrant = require('node-vibrant');
const path = require('path');

const validateConfig = require('./src/configValidator');
const validateOptions = require('./src/optionsValidator');

const { evaluateEntropy } = require('./src/imageEntropy');
const { diffImg, findImageByFrameNumber } = require('./src/imgDiff');

const { cfg } = require('./config/config');

const { makeDir, cleanUpDir, setLogLevel, removeDir } = require('./src/utils');

let tf;

const {
  getMetaData,
  getVmafMotionAvg,
  splitVideoIntoImages,
  detectBlack,
  detectFreeze,
  measureBitplaneNoise,
  detectSilence,
  measureEntropy,
  recordVideo,
  validateInputVideoSource,
} = require('./src/ffmpeg');

const { cropAndNormalizeImage } = require('./src/cropper');
const { imgNumberOcr } = require('./src/imgNumberOCR');

const eyetropy = async function(input, options, config, logLevel) {
  try {
    setLogLevel(logLevel);

    if (options == null || (options.constructor === Object && Object.entries(options).length === 0)) {
      throw Error(
        'Provide options object with at least one of these properties: \n' +
          'metaData\n' +
          'vmafMotionAvg\n' +
          'extractFrames\n' +
          'detectBlackness\n' +
          'detectFreezes\n' +
          'detectSilentParts\n' +
          'measureBitplaneNoise\n' +
          'measureEntropy\n' +
          'recordVideo',
      );
    }

    await validateInputVideoSource(input);

    await validateOptions(options);
    await validateConfig(config);
    const conf = prepareConfig(config);

    if (options.recordVideo && !fs.existsSync(conf.recordVideoTempDir)) {
      makeDir(conf.recordVideoTempDir);
    }

    if (options.extractFrames && options.extractFrames.diffImg) {
      if (!conf.imgDiff.originalImageDir) {
        throw Error('Missing config.imgDiff.originalImageDir param');
      }
      if (!fs.existsSync(conf.imgDiff.originalImageDir)) {
        throw Error('Provided config.imgDiff.originalImageDir path does not exist');
      }
      if (fs.readdirSync(conf.imgDiff.originalImageDir).length === 0) {
        throw Error('Provided config.imgDiff.originalImageDir is empty');
      }
    }

    const results = await launch(input, options, conf);

    return results;
  } catch (e) {
    log.error(`Error:\n${e.message}`);
    throw e;
  }
};

async function launch(input, options, config) {
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
    8: 'recordVideo',
  };

  if (options.metaData) {
    methods[0] = getMetaData(input);
  }

  if (options.vmafMotionAvg) {
    methods[1] = getVmafMotionAvg(input, config);
  }

  if (options.detectBlackness) {
    methods[2] = detectBlack(input, config);
  }

  if (options.detectFreezes) {
    methods[3] = detectFreeze(input, config);
  }

  if (options.detectSilentParts) {
    methods[4] = detectSilence(input, config);
  }

  if (options.measureBitplaneNoise) {
    methods[5] = measureBitplaneNoise(input, config);
  }

  if (options.measureEntropy) {
    methods[6] = measureEntropy(input, config);
  }

  if (options.extractFrames) {
    methods[7] = handleFrameExtraction(input, options, config);
  }

  if (options.recordVideo) {
    methods[8] = recordVideo(input, config);
  }

  const output = await bluebird.Promise.all(methods);

  const results = {};
  output.forEach((value, index) => {
    if (value !== 'init') {
      results[propertyNameDict[index]] = value;
    }
  });

  if (config.cleanUpFrameExtractionTempDir && fs.existsSync(config.frameExtractionTempDir)) {
    await removeDir(config.frameExtractionTempDir);
  }

  if (config.cleanUpImgNumberOcrTempDir && fs.existsSync(config.imgNumberOcrTempDir)) {
    await removeDir(config.imgNumberOcrTempDir);
  }

  return results;
}

function prepareConfig(config) {
  const output = cfg;
  if (config && config.constructor === Object && Object.entries(config).length > 0) {
    for (const key in config) {
      if (config.hasOwnProperty(key)) {
        output[key] = config[key];
      }
    }
  }
  return output;
}

async function labelImg(input, config) {
  await cropAndNormalizeImage(input, config);
  return imgNumberOcr(input, config);
}

async function handleFrameExtraction(input, options, config) {
  if (fs.existsSync(config.frameExtractionTempDir) && fs.readdirSync(config.frameExtractionTempDir).length !== 0) {
    await cleanUpDir(config.frameExtractionTempDir);
  }

  if (!fs.existsSync(config.frameExtractionTempDir)) {
    await makeDir(config.frameExtractionTempDir);
  }

  if (fs.existsSync(config.imgNumberOcrTempDir && fs.readdirSync(config.imgNumberOcrTempDir).length !== 0)) {
    await cleanUpDir(config.imgNumberOcrTempDir);
  }

  if (
    (options.extractFrames.classifyObjects || options.extractFrames.diffImg) &&
    config.imgCropper &&
    !fs.existsSync(config.imgNumberOcrTempDir)
  ) {
    await makeDir(config.imgNumberOcrTempDir);
  }

  if (config.imgDiff.options && config.imgDiff.options.file) {
    if (fs.existsSync(config.imgDiff.options.file) && fs.readdirSync(config.imgDiff.options.file).length !== 0) {
      await cleanUpDir(config.frameDiffTempDir);
    }

    if (!fs.existsSync(config.imgDiff.options.file)) {
      await makeDir(config.frameDiffTempDir);
    }
  }

  await splitVideoIntoImages(input, config);

  if (options.extractFrames.classifyObjects) {
    tf = require('./src/tensorFlow');
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
        6: 'frameOcrRawResults',
      };

      if ((options.extractFrames.classifyObjects || options.extractFrames.diffImg) && config.imgCropper) {
        frameOperations[6] = await labelImg(imgPath, config);
        if (config.imgNumberOcr.stripNonDigits) {
          frameOperations[0] = frameOperations[6].replace(/\D/g, '');
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
            if (config.imgDiff.options) {
              frameOperations[2] = diffImg(originalImage, imgPath, config.imgDiff.options);
            } else {
              frameOperations[2] = diffImg(originalImage, imgPath);
            }
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
