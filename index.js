const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const {cfg} = require('./config');
const validateConfig = require('./src/configValidator');
const validateOptions = require('./src/optionsValidator');
const tf = require('./src/tensorFlow');
const log = require('loglevel');

const {
    getMetaData,
    getVmafMotionAvg,
    splitVideoIntoJpgImages,
    detectBlack,
    detectFreeze,
    measureBitplaneNoise,
    detectSilence,
    measureEntropy
} = require('./src/ffmpeg');

const eyetropy = async function (input, options, config, logLevel) {
    try {
        if (typeof logLevel === 'string' && logLevel.match(/trace|debug|info|warn|error/gm)) {
            log.setLevel(logLevel);
        } else {
            log.setLevel('info');
        }

        await validateOptions(options);
        await validateConfig(config);
        const conf = await prepareConfig(config);

        await cleanUp(conf.tempDir);
        const results = await launch(input, options, conf);
        await cleanUp(conf.tempDir);

        return results
    } catch (e) {
        log.error(`Error:\n${e.message}`);
        throw e
    }
};

async function launch(input, options, config) {
    // if options empty or not passed return metadata
    if (options == null || Object.entries(options).length === 0 && options.constructor === Object) {
        return {metaData: await getMetaData(input)}
    }

    const methods = Array(8).fill('init');
    const propertyNameDict = {
        0: 'classificationResults',
        1: 'metaData',
        2: 'vmafMotionAvg',
        3: 'blackPeriods',
        4: 'freezePeriods',
        5: 'silentPeriods',
        6: 'bitplaneNoise',
        7: 'entropy'
    };

    if (options.classifyObjects) {
        methods[0] = classify(input, config);
    }

    if (options.metaData) {
        methods[1] = getMetaData(input);
    }

    if (options.vmafMotionAvg) {
        methods[2] = getVmafMotionAvg(input, config.vmafMotionAvg.timeLength);
    }

    if (options.detectBlackness) {
        methods[3] = detectBlack(input, config.detectBlackness.timeLength);
    }

    if (options.detectFreezes) {
        methods[4] = detectFreeze(input, config.detectFreezes.timeLength);
    }

    if (options.detectSilentPeriods) {
        methods[5] = detectSilence(input, config.detectSilentPeriods.timeLength);
    }

    if (options.measureBitplaneNoise) {
        methods[6] = measureBitplaneNoise(input, config.bitplaneNoise.frameRate, config.bitplaneNoise.timeLength);
    }

    if (options.measureEntropy) {
        methods[7] = measureEntropy(input, config.entropy.frameRate, config.entropy.timeLength);
    }

    const output = await Promise.all(methods);

    const results = {};
    output.forEach((value, index) => {
        if (value !== 'init') {
            results[propertyNameDict[index]] = value;
        }
    });

    return results
}

async function prepareConfig(config) {
    const output = cfg;
    if (config && Object.entries(config).length > 0 && config.constructor === Object) {
        for (const key in config) {
            if (config.hasOwnProperty(key)) output[key] = config[key];
        }
    }
    return output
}

async function classify(input, config) {
    await splitVideoIntoJpgImages(input, config.splitImages.frameRate, config.splitImages.timeLength);
    return await tf.getClassifiedObjectsForImages(config.tempDir);
}

async function cleanUp(dir) {
    try {
        log.info(`[cleanup]: start cleanup for ${dir} `);
        const files = await readdir(dir);

        files.forEach(async (file) => {
            await unlink(path.join(dir, file))
        });
        log.info('[cleanup]: finish cleanup process\n');
    } catch (e) {
        e.message = `[cleanup]: error cleaning up directory\n${e.message}`;
        throw e
    }
}

module.exports = eyetropy;
