const path = require('path');
const log = require('loglevel');
const sharp = require('sharp');
const { cfg } = require('../config/config');
const imgCropperLogLabel = cfg.logLabel.imgCropper;

module.exports.cropAndNormalizeImage = async function(input, config) {
  try {
    log.info(
      `${imgCropperLogLabel}: start reading, b-w normalizing, cropping ` +
        `buffer with ${config.imgCropper.bwThreshold} threshold`,
    );

    const imgMetaData = await sharp(input).metadata();
    log.debug(`${imgCropperLogLabel}: image dimensions: ${imgMetaData.width} x ${imgMetaData.height}`);

    if (config.imgCropper.rectangle) {
      config.imgCropper.width = config.imgCropper.rectangle.width || Math.floor((imgMetaData.width / 100) * 7);
      config.imgCropper.height = config.imgCropper.rectangle.height || Math.floor((imgMetaData.height / 100) * 3);
      if (config.imgCropper.rectangle.type === 'top-left') {
        config.imgCropper.left = config.imgCropper.left || 0;
        config.imgCropper.top = config.imgCropper.top || 0;
      }
      if (config.imgCropper.rectangle.type === 'bottom-left') {
        config.imgCropper.left = config.imgCropper.left || 0;
        config.imgCropper.top = config.imgCropper.top || imgMetaData.height - config.imgCropper.height;
      }
      if (config.imgCropper.rectangle.type === 'bottom-right') {
        config.imgCropper.left = config.imgCropper.left || imgMetaData.width - config.imgCropper.width;
        config.imgCropper.top = config.imgCropper.top || imgMetaData.height - config.imgCropper.height;
      }
      if (config.imgCropper.rectangle.type === 'top-right') {
        config.imgCropper.left = config.imgCropper.left || imgMetaData.width - config.imgCropper.width;
        config.imgCropper.top = config.imgCropper.top || 0;
      }
    }

    log.debug(`${imgCropperLogLabel}: rectangle dimensions: ${JSON.stringify(config.imgCropper)}`);

    let buf = await sharp(input)
      .extract({
        width: config.imgCropper.width,
        height: config.imgCropper.height,
        left: config.imgCropper.left,
        top: config.imgCropper.top,
      })
      .normalize()
      .toColourspace('b-w')
      .sharpen()
      .toBuffer();

    const imgPath = path.join(config.imgNumberOcrTempDir, path.basename(input));

    if (config.imgCropper.bwThreshold) {
      buf = await sharp(buf)
        .threshold(config.imgCropper.bwThreshold)
        .toBuffer();
    }

    log.info(`${imgCropperLogLabel}: write to file`);
    await sharp(buf)
      .extend({
        left: 0,
        bottom: 0,
        right: config.imgCropper.width * 3,
        top: config.imgCropper.height * 3,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toFile(imgPath);

    log.info(`${imgCropperLogLabel}: finish cropping image`);
  } catch (e) {
    e.message = `${imgCropperLogLabel}: error cropping image\n${e.message}`;
    throw e;
  }
};
