const joi = require('joi');
const log = require('loglevel');

async function validateOptions(options) {
    log.info('[options-validator]: validate options');
    const schema = joi.object().keys({
        metaData: joi.boolean().valid(true),
        vmafMotionAvg: joi.boolean().valid(true),
        classifyObjects: joi.boolean().valid(true),
        detectBlackness: joi.boolean().valid(true),
        detectFreezes: joi.boolean().valid(true),
        detectSilentPeriods: joi.boolean().valid(true),
        measureBitplaneNoise: joi.boolean().valid(true),
        measureEntropy: joi.boolean().valid(true)
    });

    try {
        await joi.validate(options, schema, { abortEarly: false });
        log.info('[options-validator]: successfully validated options');
    } catch (e) {
        e.message = `[options-validator]: options parameters validation failure: ${e.message}`;
        throw e
    }
}

module.exports = validateOptions;
