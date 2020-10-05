const joi = require('joi');
const log = require('loglevel');
const { cfg } = require('../config/config');

const optionsValidatorLogLabel = cfg.logLabel.optionsValidator;

async function validateOptions(options) {
  log.info(`${cfg.logLabel.optionsValidator}: validate options`);
  const schema = joi.object().keys({
    metaData: joi.boolean().valid(true),
    vmafMotionAvg: joi.boolean().valid(true),
    extractFrames: joi.object().keys({
      classifyObjects: joi.boolean().valid(true),
      diffImg: joi.boolean().valid(true),
      imgMetaData: joi.boolean().valid(true),
      imgDominantColours: joi.boolean().valid(true),
      imgEntropy: joi.boolean().valid(true),
    }),
    detectBlackness: joi.boolean().valid(true),
    detectFreezes: joi.boolean().valid(true),
    detectSilentParts: joi.boolean().valid(true),
    measureBitplaneNoise: joi.boolean().valid(true),
    measureEntropy: joi.boolean().valid(true),
    recordVideo: joi.boolean().valid(true),
  });

  try {
    await joi.validate(options, schema, { abortEarly: false });
    log.info(`${optionsValidatorLogLabel}: successfully validated options`);
  } catch (e) {
    e.message = `${optionsValidatorLogLabel}: options parameters validation failure: ${e.message}`;
    throw e;
  }
}

module.exports = validateOptions;
