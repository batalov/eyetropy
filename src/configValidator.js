const joi = require('joi');
const log = require('loglevel');
const {cfg} = require('../config/config');

async function validateConfig(config) {
    log.info(`${cfg.logLabel.configValidator}: validate config`);
    const schema = joi.object().keys({
        tensorFlow: joi.object().keys({
            numberOfChannels: joi.number().integer().min(1)
        }),
        vmafMotionAvg: joi.object().keys({
            timeLength: joi.number().integer().min(1)
        }),
        detectBlackness: joi.object().keys({
            timeLength: joi.number().integer().min(1)
        }),
        detectFreezes: joi.object().keys({
            timeLength: joi.number().integer().min(1)
        }),
        detectSilentParts: joi.object().keys({
            timeLength: joi.number().integer().min(1)
        }),
        entropy: joi.object().keys({
            frameRate: joi.string().regex(/^\d{1,4}\/\d{1,4}$|^\d{1,4}$/),
            timeLength: joi.number().integer().min(1)
        }),
        bitplaneNoise: joi.object().keys({
            frameRate: joi.string().regex(/^\d{1,4}\/\d{1,4}$|^\d{1,4}$/),
            timeLength: joi.number().integer().min(1)
        }),
        splitImages: joi.object().keys({
            frameRate: joi.string().regex(/^\d{1,4}\/\d{1,4}$|^\d{1,4}$/),
            timeLength: joi.number().integer().min(1)
        }),
        tempDir: joi.string()
    });

    try {
        await joi.validate(config, schema, { abortEarly: false });
        log.info(`${cfg.logLabel.configValidator}: successfully validated config`);
    } catch (e) {
        e.message = `${cfg.logLabel.configValidator}: config parameters validation failure: ${e.message}`;
        throw e
    }
}

module.exports = validateConfig;
