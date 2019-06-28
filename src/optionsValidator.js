const joi = require('joi');
const log = require('loglevel');
const {cfg} = require('../config/config');

async function validateOptions(options) {
    log.info(`${cfg.logLabel.optionsValidator}: validate options`);
    const schema = joi.object().keys({
        metaData: joi.boolean().valid(true),
        vmafMotionAvg: joi.boolean().valid(true),
        classifyObjects: joi.boolean().valid(true),
        detectBlackness: joi.boolean().valid(true),
        detectFreezes: joi.boolean().valid(true),
        detectSilentParts: joi.boolean().valid(true),
        measureBitplaneNoise: joi.boolean().valid(true),
        measureEntropy: joi.boolean().valid(true)
    });

    try {
        await joi.validate(options, schema, { abortEarly: false });
        log.info(`${cfg.logLabel.optionsValidator}: successfully validated options`);
    } catch (e) {
        e.message = `${cfg.logLabel.optionsValidator}: options parameters validation failure: ${e.message}`;
        throw e
    }
}

module.exports = validateOptions;
