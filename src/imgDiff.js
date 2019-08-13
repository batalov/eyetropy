const gm = require('gm');
const log = require('loglevel');
const fs = require('fs');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const path = require('path');
const { cfg } = require('../config/config');

module.exports.diffImg = (path1, path2, options) => {
  return new Promise(resolve => {
    log.info(`${cfg.logLabel.imgDiff}: start calculating difference between ${path1} and ${path2} images`);
    const opts = options || {};
    gm.compare(path1, path2, opts, (err, isEqual, equality, raw) => {
      if (err) {
        err.message = `${cfg.logLabel.imgDiff}: error evaluating difference for two images\n${err.message}`;
        throw err;
      }
      log.info(`${cfg.logLabel.imgDiff}: finish calculating difference between ${path1} and ${path2} images`);
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
    log.info(`${cfg.logLabel.imgDiff}: sitart searching for image in ${dir} by frame number ${frameNumber}`);
    const files = await readdir(dir);
    const result = files.find(element => {
      if (element.includes(frameNumber)) {
        return element;
      }
    });
    log.info(`${cfg.logLabel.imgDiff}: finish search for image by frame number`);
    if (typeof result === 'undefined') {
      log.info(`${cfg.logLabel.imgDiff}: no image path was found for ${dir} dir with ${frameNumber} frame number`);
      return null;
    }
    return path.join(dir, result);
  } catch (e) {
    e.message = `${cfg.logLabel.imgDiff}: error searching for image by frame number\n${e.message}`;
    throw e;
  }
};
