const path = require('path');
const log = require('loglevel');
const Promise = require('bluebird');
const tesseract = Promise.promisifyAll(require('node-tesseract-ocr'));
const { cfg } = require('../config/config');

const imgOcrLogLabel = cfg.logLabel.imgOcr;

module.exports.imgNumberOcr = async function(input, config) {
  try {
    log.info(`${imgOcrLogLabel}: start image OCR process`);

    const results = await tesseract.recognize(path.join(config.imgNumberOcrTempDir, path.basename(input)), {
      lang: config.imgNumberOcr.lang,
      oem: config.imgNumberOcr.oem,
      psm: config.imgNumberOcr.psm,
    });

    log.info(`${imgOcrLogLabel}: finish image OCR process`);
    return results;
  } catch (e) {
    e.message = `${imgOcrLogLabel}: error evaluating image OCR\n${e.message}`;
    throw e;
  }
};
