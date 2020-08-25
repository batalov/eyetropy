const path = require('path');
const os = require('os');

module.exports.cfg = {
  tensorFlow: {
    numberOfChannels: 3,
    model: 'mobilenet',
  },
  vmafMotionAvg: {
    timeLength: 5,
  },
  detectBlackness: {
    timeLength: 5,
  },
  detectFreezes: {
    timeLength: 5,
  },
  detectSilentParts: {
    timeLength: 5,
  },
  entropy: {
    frameRate: '1',
    timeLength: 5,
  },
  bitplaneNoise: {
    frameRate: '1',
    timeLength: 5,
  },
  splitImages: {
    frameRate: '1',
    timeLength: 5,
    imageExtension: 'bmp',
  },
  frameExtractionTempDir: path.join(os.tmpdir(), '/frame_extraction_storage'),
  imgNumberOcrTempDir: path.join(os.tmpdir(), '/ocr_storage'),
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
    mkDir: '[make-dir]',
    cleanUp: '[cleanup]',
    rmDir: '[remove-dir]',
    imgCropper: '[crop-image]',
    imgOcr: '[image-ocr]',
    imgEntropy: '[image-entropy]',
    imgDiff: '[image-diff]',
    frameExtractionHandler: '[frame-extraction-handler]',
  },
  commandLineBuffer: { maxBuffer: 1024 * 10000 },
};
