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

    let opts = {};

    if (options) {
      opts = Object.assign(opts, options);
    }

    if (opts.file) {
      const frameIndex = path.basename(path1, path.extname(path1));
      const originalFileBaseName = path.basename(opts.file);
      const originalPath = path.parse(opts.file);

      opts.file = path.join(originalPath.dir, `${frameIndex}_${originalFileBaseName}`);

      log.info(`${imgDiffLogLabel}: diff image path ${opts.file}`);
    }

    gm.compare(path1, path2, opts, (err, isEqual, equality, raw) => {
      if (err) {
        err.message = `${imgDiffLogLabel}: error evaluating difference for two images\n${err.message}`;
        throw err;
      }
      log.info(`${imgDiffLogLabel}: finish calculating difference between ${path1} and ${path2} images`);

      const output = {
        firstImage: path1,
        secondImage: path2,
        ocrNumberImage: path.join(cfg.imgNumberOcrTempDir, path.basename(path2)),
        equality: equality,
        raw: raw,
      };

      if (opts.file) {
        output.differenceImage = opts.file;
      }

      resolve(output);
    });
  });
};

module.exports.findImageByFrameNumber = async (dir, frameNumber) => {
  try {
    log.info(`${imgDiffLogLabel}: start searching for image in ${dir} by frame number ${frameNumber}`);
    const files = await readdir(dir);
    const result = files.find(element => {
      if (element.includes(frameNumber)) {
        return element;
      }
    });
    log.info(`${imgDiffLogLabel}: finish search for image by frame number ${frameNumber}`);
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
