const path = require('path');
const os = require('os');

module.exports.cfg = {
  tensorFlow: {
    numberOfChannels: 3,
    model: 'mobilenet',
  },
  splitImages: {
    imageExtension: 'png',
  },
  frameExtractionTempDir: path.join(os.tmpdir(), '/frame_extraction_storage'),
  imgNumberOcrTempDir: path.join(os.tmpdir(), '/ocr_storage'),
  cleanUpFrameExtractionTempDir: true,
  cleanUpImgNumberOcrTempDir: true,
  imgNumberOcr: {
    stripNonDigits: true,
    lang: 'eng',
    oem: 1,
    psm: 6,
  },
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
