const path = require('path');
const log = require('loglevel');
const Promise = require('bluebird');
const tesseract = Promise.promisifyAll(require('node-tesseract-ocr'));
const { cfg } = require('../config/config');

module.exports.imgNumberOcr = async function(input, config) {
  try {
    log.info(`${cfg.logLabel.imgOcr}: start image OCR process`);
    if (!config.imgNumberOcr) {
      config.imgNumberOcr = {
        stripNonDigits: true,
        lang: 'eng',
        oem: 1,
        psm: 6,
      };
    }

    const results = await tesseract.recognize(path.join(config.imgNumberOcrTempDir, path.basename(input)), {
      lang: config.imgNumberOcr.lang,
      oem: config.imgNumberOcr.oem,
      psm: config.imgNumberOcr.psm,
    });

    log.info(`${cfg.logLabel.imgOcr}: finish image OCR process`);
    return results;
  } catch (e) {
    e.message = `${cfg.logLabel.imgOcr}: error evaluating image OCR\n${e.message}`;
    throw e;
  }
};
