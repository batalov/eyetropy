const sharp = require('sharp');
const log = require('loglevel');
const { cfg } = require('../config/config');

module.exports.evaluateEntropy = async input => {
  const buf = await sharp(input)
    .toColourspace('b-w')
    .raw()
    .toBuffer();
  const metaData = await sharp(input).metadata();

  const height = metaData.height;
  const width = metaData.width;

  log.debug(`${cfg.logLabel.imgEntropy}: computing probabilities`);

  const probLen = 256 * 2 - 1;
  const probabilities = new Uint32Array(probLen);

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width - 1; j++) {
      const diff = buf[i * metaData.width + j + 1] - buf[i * metaData.width + j];
      if (diff < +(probLen + 1) / 2 && diff > -(probLen + 1) / 2) {
        probabilities[diff + (probLen - 1) / 2]++;
      }
    }
  }
  log.debug(`${cfg.logLabel.imgEntropy}: finish computing probabilities`);

  log.info(`${cfg.logLabel.imgEntropy}: computing entropy`);

  const total = probabilities.reduce((total, current) => total + current, 0);
  let entropy = 0;

  for (let i = 0; i < probLen; i++) {
    const prob = probabilities[i] / total;

    if (prob !== 0) {
      entropy = entropy - prob * Math.log(prob);
    }
  }

  entropy = entropy / Math.log(2);
  log.info(`${cfg.logLabel.imgEntropy}: finish computing entropy with ${entropy} value`);

  return entropy;
};
