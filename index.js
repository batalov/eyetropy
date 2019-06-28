const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const {cfg} = require('./config/config');
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
        setLogLevel(logLevel);
        await validateOptions(options);
        await validateConfig(config);
        const conf = await prepareConfig(config);

        const results = await launch(input, options, conf);

        return results
    } catch (e) {
        log.error(`Error:\n${e.message}`);
        throw e
    }
};

async function launch(input, options, config) {
    // if options empty or not passed return metadata
    if (options == null || options.constructor === Object && Object.entries(options).length === 0) {
        return {metaData: await getMetaData(input)}
    }

    const methods = Array(8).fill('init');
    const propertyNameDict = {
        0: 'classificationResults',
        1: 'metaData',
        2: 'vmafMotionAvg',
        3: 'blackParts',
        4: 'freezeParts',
        5: 'silentParts',
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

    if (options.detectSilentParts) {
        methods[5] = detectSilence(input, config.detectSilentParts.timeLength);
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
    if (config && config.constructor === Object && Object.entries(config).length > 0) {
        for (const key in config) {
            if (config.hasOwnProperty(key)) output[key] = config[key];
        }
    }
    return output
}

async function classify(input, config) {
    await checkDir(config.tempDir);
    await cleanUp(config.tempDir);
    await splitVideoIntoJpgImages(input, config.splitImages.frameRate, config.splitImages.timeLength);
    const results = await tf.getClassifiedObjectsForImages(config.tempDir);
    await cleanUp(config.tempDir);
    return results
}

async function checkDir(dir, config) {
    try {
        log.info(`${cfg.logLabel.checkDir}: start checking directory for existence`);
        if (fs.existsSync(dir)) {
            log.info(`${cfg.logLabel.checkDir}: directory ${dir} exists`);
        } else {
            log.info(`${cfg.logLabel.checkDir}: directory ${dir} does not exist, making dir /tmp`);
            fs.mkdirSync(config.tempDir);
        }
    } catch (e) {
        e.message = `${cfg.logLabel.checkDir}: error making directory \n${e.message}`;
        throw e
    }
}

async function cleanUp(dir) {
    try {
        log.info(`${cfg.logLabel.cleanUp}: start cleanup for ${dir}`);
        const files = await readdir(dir);

        files.forEach(async (file) => {
            await unlink(path.join(dir, file))
        });
        log.info(`${cfg.logLabel.cleanUp}: finish cleanup process\n`);
    } catch (e) {
        e.message = `${cfg.logLabel.cleanUp}: error cleaning up directory\n${e.message}`;
        throw e
    }
}

function setLogLevel(logLevel) {
    if (typeof logLevel === 'string' && logLevel.match(/trace|debug|info|warn|error/gm)) {
        log.setLevel(logLevel);
    } else {
        log.setLevel('info');
    }
}

module.exports = eyetropy;
