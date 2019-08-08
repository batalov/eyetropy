const sharp = require('sharp');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const { cfg } = require('../config/config');
const log = require('loglevel');
const mobilenet = require('@tensorflow-models/mobilenet');
const cocoSsd = require('@tensorflow-models/coco-ssd');

let tfModel;

async function loadModel(config) {
  if (config.tensorFlow.model === 'mobilenet') {
    log.info(`${cfg.logLabel.tensorFlow}: using mobilenet model`);
    return mobilenet.load();
  }

  if (config.tensorFlow.model === 'coco-ssd') {
    log.info(`${cfg.logLabel.tensorFlow}: using coco-ssd model`);
    return cocoSsd.load();
  }
}

async function readImage(path) {
  try {
    log.info(`${cfg.logLabel.tensorFlow}: read image ${path}`);
    const { info, data } = await sharp(path)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const result = { width: info.width, height: info.height, data: data };
    log.debug(`${cfg.logLabel.tensorFlow}: image pixels info\n${JSON.stringify(info)}`);
    return result;
  } catch (e) {
    e.message = `${cfg.logLabel.tensorFlow}: error reading image\n${e.message}`;
    throw e;
  }
}

function imageToInput(image, config) {
  try {
    log.info(`${cfg.logLabel.tensorFlow}: transform image pixels array into tensorflow 3d object`);
    const outShape = [image.height, image.width, config.tensorFlow.numberOfChannels];
    const result = tf.tensor3d(image.data, outShape, 'int32');
    log.debug(`${cfg.logLabel.tensorFlow}: tensorflow object is\n${JSON.stringify(result)}`);
    return result;
  } catch (e) {
    e.message = `${cfg.logLabel.tensorFlow}: error transforming image into tensorflow 3d object\n${e.message}`;
    throw e;
  }
}

module.exports.classify = async function(image, config) {
  try {
    const img = await readImage(image);
    const input = imageToInput(img, config);

    log.info(`${cfg.logLabel.tensorFlow}: classify image ${image}`);

    let predictions;
    if (config.tensorFlow.model === 'mobilenet') {
      predictions = await tfModel.classify(input);
    }

    if (config.tensorFlow.model === 'coco-ssd') {
      predictions = await tfModel.detect(input);
    }

    log.info(`${cfg.logLabel.tensorFlow}: finish classification process for file ${image}:\n`);
    log.debug(`${cfg.logLabel.tensorFlow}: classification results\n${JSON.stringify(predictions)}`);

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
    e.message = `${cfg.logLabel.tensorFlow}: error classifying image\n${e.message}`;
    throw e;
  }
};

module.exports.load = async function(config) {
  log.info(`${cfg.logLabel.tensorFlow}: load model`);
  tfModel = await loadModel(config);
};
