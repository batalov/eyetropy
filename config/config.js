const path = require('path');

module.exports.cfg = {
    tensorFlow: {
        numberOfChannels: 3
    },
    vmafMotionAvg: {
        timeLength: 5
    },
    detectBlackness: {
        timeLength: 5
    },
    detectFreezes: {
        timeLength: 5
    },
    detectSilentParts: {
        timeLength: 5
    },
    entropy: {
        frameRate: '1',
        timeLength: 5
    },
    bitplaneNoise: {
        frameRate: '1',
        timeLength: 5
    },
    splitImages: {
        frameRate: '1',
        timeLength: 5
    },
    tempDir: path.normalize('./tmp'),
    logLabel: {
        configValidator: '[config-validator]',
        optionsValidator: '[options-validator]',
        tensorFlow: '[tensor-flow]',
        metaData: '[meta-data]',
        vmaf: '[VMAF]',
        blackDetect: '[black-detect]',
        freezeDetect: '[freeze-detect]',
        silenceDetect: '[silence-detect]',
        bitplaneNoise: '[bitplane-noise]',
        entropy: '[entropy]',
        splitImage: '[split-image]',
        checkDir: '[check-dir]',
        cleanUp: '[cleanup]'
    },
    commandLineBuffer: {maxBuffer: 1024 * 10000}
};
