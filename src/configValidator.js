const joi = require('joi');
const log = require('loglevel');
const { cfg } = require('../config/config');

const configValidatorLogLabel = cfg.logLabel.configValidator;

async function validateConfig(config) {
  log.info(`${configValidatorLogLabel}: validate config`);
  const schema = joi.object().keys({
    tensorFlow: joi.object().keys({
      numberOfChannels: joi
        .number()
        .integer()
        .min(1),
      model: joi.string().regex(/^mobilenet|coco-ssd$/),
    }),
    timeLength: joi
      .number()
      .integer()
      .min(1),
    splitImages: joi.object().keys({
      imageExtension: joi.string().regex(/^png|jpg$/),
      jpegQuality: joi
        .number()
        .integer()
        .min(1)
        .max(31),
    }),
    frameDiffTempDir: joi.string(),
    frameExtractionTempDir: joi.string(),
    imgNumberOcrTempDir: joi.string(),
    recordVideoTempDir: joi.string(),
    cleanUpFrameExtractionTempDir: joi.boolean(),
    cleanUpImgNumberOcrTempDir: joi.boolean(),
    imgCropper: joi.object().keys({
      bwThreshold: joi.number().min(0),
      toBlackWhiteColourSpace: joi.boolean(),
      normalizeImg: joi.boolean(),
      sharpenImg: joi.boolean(),
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
      options: {
        file: joi.string(),
        highlightColor: joi.string().regex(/^yellow|red|purple$/),
        tolerance: joi.number(),
        highlightStyle: joi.string().regex(/^Assign|Threshold|Tint|XOR$/),
      },
    }),
  });

  try {
    await joi.validate(config, schema, { abortEarly: false });
    log.info(`${configValidatorLogLabel}: successfully validated config`);
  } catch (e) {
    e.message = `${configValidatorLogLabel}: config parameters validation failure: ${e.message}`;
    throw e;
  }
}

module.exports = validateConfig;
