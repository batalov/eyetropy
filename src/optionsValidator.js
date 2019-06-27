const joi = require('joi');
const log = require('loglevel');

async function validateOptions(options) {
    log.info('Validate options');
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
        log.info('Successfully validated options');
    } catch (e) {
        e.message = `Options parameters validation failure: ${e.message}`;
        throw e
    }
}

module.exports = validateOptions;
