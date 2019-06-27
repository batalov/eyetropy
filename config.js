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
    detectSilentPeriods: {
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
    tempDir: './tmp'
};
