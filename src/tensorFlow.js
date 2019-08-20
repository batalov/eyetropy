const sharp = require('sharp');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const { cfg } = require('../config/config');
const log = require('loglevel');
const mobilenet = require('@tensorflow-models/mobilenet');
const cocoSsd = require('@tensorflow-models/coco-ssd');

const tfLogLabel = cfg.logLabel.tensorFlow;

let tfModel;

async function loadModel(config) {
  if (config.tensorFlow.model === 'mobilenet') {
    log.info(`${tfLogLabel}: using mobilenet model`);
    return mobilenet.load();
  }

  if (config.tensorFlow.model === 'coco-ssd') {
    log.info(`${tfLogLabel}: using coco-ssd model`);
    return cocoSsd.load();
  }
}

async function readImage(path) {
  try {
    log.info(`${tfLogLabel}: read image ${path}`);
    const { info, data } = await sharp(path)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const result = { width: info.width, height: info.height, data: data };
    log.debug(`${tfLogLabel}: image pixels info\n${JSON.stringify(info)}`);
    return result;
  } catch (e) {
    e.message = `${tfLogLabel}: error reading image\n${e.message}`;
    throw e;
  }
}

function imageToInput(image, config) {
  try {
    log.info(`${tfLogLabel}: transform image pixels array into tensorflow 3d object`);
    const outShape = [image.height, image.width, config.tensorFlow.numberOfChannels];
    const result = tf.tensor3d(image.data, outShape, 'int32');
    log.debug(`${tfLogLabel}: tensorflow object is\n${JSON.stringify(result)}`);
    return result;
  } catch (e) {
    e.message = `${tfLogLabel}: error transforming image into tensorflow 3d object\n${e.message}`;
    throw e;
  }
}

module.exports.classify = async function(image, config) {
  try {
    const img = await readImage(image);
    const input = imageToInput(img, config);

    log.info(`${tfLogLabel}: classify image ${image}`);

    let predictions;
    if (config.tensorFlow.model === 'mobilenet') {
      predictions = await tfModel.classify(input);
    }

    if (config.tensorFlow.model === 'coco-ssd') {
      predictions = await tfModel.detect(input);
    }

    log.info(`${tfLogLabel}: finish classification process for file ${image}:\n`);
    log.debug(`${tfLogLabel}: classification results\n${JSON.stringify(predictions)}`);

    return {
      frame: Number(
        image
          .split('thumb')
          .pop()
          .replace(/\.jpg/gm, ''),
      ),
      classifiedObjects: predictions,
    };
  } catch (e) {
    e.message = `${tfLogLabel}: error classifying image\n${e.message}`;
    throw e;
  }
};

module.exports.load = async function(config) {
  log.info(`${tfLogLabel}: load model`);
  tfModel = await loadModel(config);
};
