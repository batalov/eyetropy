const joi = require('joi');
const log = require('loglevel');
const { cfg } = require('../config/config');

async function validateConfig(config) {
  log.info(`${cfg.logLabel.configValidator}: validate config`);
  const schema = joi.object().keys({
    tensorFlow: joi.object().keys({
      numberOfChannels: joi
        .number()
        .integer()
        .min(1),
      model: joi.string().regex(/^mobilenet|coco-ssd$/),
    }),
    vmafMotionAvg: joi.object().keys({
      timeLength: joi
        .number()
        .integer()
        .min(1),
    }),
    detectBlackness: joi.object().keys({
      timeLength: joi
        .number()
        .integer()
        .min(1),
    }),
    detectFreezes: joi.object().keys({
      timeLength: joi
        .number()
        .integer()
        .min(1),
    }),
    detectSilentParts: joi.object().keys({
      timeLength: joi
        .number()
        .integer()
        .min(1),
    }),
    entropy: joi.object().keys({
      frameRate: joi.string().regex(/^\d{1,4}\/\d{1,4}$|^\d{1,4}$/),
      timeLength: joi
        .number()
        .integer()
        .min(1),
    }),
    bitplaneNoise: joi.object().keys({
      frameRate: joi.string().regex(/^\d{1,4}\/\d{1,4}$|^\d{1,4}$/),
      timeLength: joi
        .number()
        .integer()
        .min(1),
    }),
    splitImages: joi.object().keys({
      frameRate: joi.string().regex(/^\d{1,4}\/\d{1,4}$|^\d{1,4}$/),
      timeLength: joi
        .number()
        .integer()
        .min(1),
    }),
    frameExtractionTempDir: joi.string(),
    imgNumberOcrTempDir: joi.string(),
    imgCropper: joi.object().keys({
      bwThreshold: joi.number().min(0),
      rectangle: joi.object().keys({
        type: joi
          .string()
          .regex(/^top-left|bottom-left|bottom-right|top-right|custom$/)
          .required(),
        width: joi.number().min(0),
        height: joi.number().min(0),
        left: joi.number().min(0),
        top: joi.number().min(0),
      }),
    }),
    imgNumberOcr: joi.object().keys({
      lang: joi.string().required(),
      oem: joi
        .number()
        .min(0)
        .required(),
      psm: joi
        .number()
        .min(0)
        .required(),
      stripNonDigits: joi.boolean(),
    }),
    imgDiff: joi.object().keys({
      originalImageDir: joi.string().required(),
    }),
  });

  try {
    await joi.validate(config, schema, { abortEarly: false });
    log.info(`${cfg.logLabel.configValidator}: successfully validated config`);
  } catch (e) {
    e.message = `${cfg.logLabel.configValidator}: config parameters validation failure: ${e.message}`;
    throw e;
  }
}

module.exports = validateConfig;
