const fs = require('fs');
const sharp = require('sharp');
const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');
require('@tensorflow/tfjs-node');
const {cfg} = require('../config/config');
const log = require('loglevel');

let tfModel;

async function loadModel() {
    return await mobilenet.load();
}

const NUMBER_OF_CHANNELS = cfg.tensorFlow.numberOfChannels;

async function readImage(path) {
    try {
        log.info(`${cfg.logLabel.tensorFlow}: read image ${path}`);
        const {info, data} = await sharp(path).removeAlpha().raw().toBuffer({resolveWithObject: true});
        const result = {width: info.width, height: info.height, data: data};
        log.debug(`${cfg.logLabel.tensorFlow}: image pixels info\n${JSON.stringify(info)}`);
        return result
    } catch (e) {
        e.message = `${cfg.logLabel.tensorFlow}: error reading image\n${e.message}`;
        throw e;
    }
}

function imageToInput(image, numChannels) {
    try {
        log.info(`${cfg.logLabel.tensorFlow}: transform image pixels array into tensorflow 3d object`);
        const outShape = [image.height, image.width, numChannels];
        const result = tf.tensor3d(image.data, outShape, 'int32');
        log.debug(`${cfg.logLabel.tensorFlow}: tensorflow object is\n${JSON.stringify(result)}`);
        return result
    } catch (e) {
        e.message = `${cfg.logLabel.tensorFlow}: error transforming image into tensorflow 3d object\n${e.message}`;
        throw e
    }
}

async function classify(path) {
    try {
        const image = await readImage(path);
        const input = imageToInput(image, NUMBER_OF_CHANNELS);

        log.info(`${cfg.logLabel.tensorFlow}: classify image ${path}`);
        const predictions = await tfModel.classify(input);
        log.info(`${cfg.logLabel.tensorFlow}: finish classification process for file ${path}:\n`);
        log.debug(`${cfg.logLabel.tensorFlow}: classification results\n${JSON.stringify(predictions)}`);

        return {
            frame: path.split('/').pop().replace(/thumb[0]*|.jpg/gm, ''),
            classifiedObjects: predictions
        }
    } catch (e) {
        e.message = `${cfg.logLabel.tensorFlow}: error classifying image\n${e.message}`;
        throw e
    }
}

module.exports.getClassifiedObjectsForImages = async (path) => {
    try {
        log.info(`${cfg.logLabel.tensorFlow}: load model`);
        tfModel = await loadModel();

        const dir = `${__dirname.replace('/src', '')}/tmp`;
        log.info(`${cfg.logLabel.tensorFlow}: start classification process inside ${dir}`);

        log.info(`${cfg.logLabel.tensorFlow}: read filenames`);
        const files = await fs.readdirSync(path);

        const classificationResults = await Promise.all(files.map((file) => {
            return classify(`${dir}/${file}`);
        }));

        log.info(`${cfg.logLabel.tensorFlow}: finish classification process \n`);
        log.debug(`${cfg.logLabel.tensorFlow}: full classification results:\n ${JSON.stringify(classificationResults)}`);

        return classificationResults;
    } catch (e) {
        e.message = `${cfg.logLabel.tensorFlow}: error evaluating multiple image object classification\n${e.message}`;
        throw e
    }
};
