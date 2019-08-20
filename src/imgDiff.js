const gm = require('gm');
const log = require('loglevel');
const fs = require('fs');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const path = require('path');
const { cfg } = require('../config/config');

const imgDiffLogLabel = cfg.logLabel.imgDiff;

module.exports.diffImg = (path1, path2, options) => {
  return new Promise(resolve => {
    log.info(`${imgDiffLogLabel}: start calculating difference between ${path1} and ${path2} images`);
    const opts = options || {};
    gm.compare(path1, path2, opts, (err, isEqual, equality, raw) => {
      if (err) {
        err.message = `${imgDiffLogLabel}: error evaluating difference for two images\n${err.message}`;
        throw err;
      }
      log.info(`${imgDiffLogLabel}: finish calculating difference between ${path1} and ${path2} images`);
      resolve({
        isEqual: isEqual,
        equality: equality,
        raw: raw,
      });
    });
  });
};

module.exports.findImageByFrameNumber = async (dir, frameNumber) => {
  try {
    log.info(`${imgDiffLogLabel}: sitart searching for image in ${dir} by frame number ${frameNumber}`);
    const files = await readdir(dir);
    const result = files.find(element => {
      if (element.includes(frameNumber)) {
        return element;
      }
    });
    log.info(`${imgDiffLogLabel}: finish search for image by frame number`);
    if (typeof result === 'undefined') {
      log.info(`${imgDiffLogLabel}: no image path was found for ${dir} dir with ${frameNumber} frame number`);
      return null;
    }
    return path.join(dir, result);
  } catch (e) {
    e.message = `${imgDiffLogLabel}: error searching for image by frame number\n${e.message}`;
    throw e;
  }
};
