const ffmpeg = require('fluent-ffmpeg');
const { promisify } = require('util');
const { exec } = require('child_process');
const execute = promisify(exec);
const log = require('loglevel');
const { cfg } = require('../config/config');
const path = require('path');

module.exports.getMetaData = async input => {
  const metaDataLogLabel = cfg.logLabel.metaData;
  try {
    log.info(`${metaDataLogLabel}: start collecting meta data`);
    const ffprobe = promisify(ffmpeg.ffprobe);
    const output = await ffprobe(input);
    log.info(`${metaDataLogLabel}: finish collecting meta data \n`);
    log.debug(`${metaDataLogLabel}: output \n ${JSON.stringify(output)}`);
    return output;
  } catch (e) {
    e.message = `${metaDataLogLabel}: error collecting metadata\n${e.message}`;
    throw e;
  }
};

module.exports.getVmafMotionAvg = async (input, config) => {
  const vmafLogLabel = cfg.logLabel.vmaf;
  try {
    log.info(`${vmafLogLabel}: start evaluating VMAF Motion Average`);

    let timeArg = '';

    if (config.timeLength) {
      timeArg = formatTimeArg(config.timeLength);
    }

    const ffmpegCmd = `ffmpeg ${timeArg} -i ${input} -vf vmafmotion -f null -`;
    log.info(`Executing ffmpeg: ${ffmpegCmd}`);
    const { stdout, stderr } = await execute(ffmpegCmd, cfg.commandLineBuffer);
    const vmafMotionAvg = Number(stderr.match(/(?<=VMAF Motion avg: ).*/gm)[0]);
    log.info(`${vmafLogLabel}: finish evaluating VMAF Motion Average`);
    log.debug(`${vmafLogLabel}: stdout output \n ${stdout}`);
    log.debug(`${vmafLogLabel}: stderr output \n ${stderr}`);
    log.debug(`${vmafLogLabel}: value ${vmafMotionAvg}`);
    return vmafMotionAvg;
  } catch (e) {
    e.message = `${vmafLogLabel}: error evaluating VMAF Motion Average\n${e.message}`;
    throw e;
  }
};

module.exports.detectBlack = async (input, config) => {
  const blackDetectLogLabel = cfg.logLabel.blackDetect;
  try {
    log.info(`${blackDetectLogLabel}: start detecting black parts`);

    let timeArg = '';

    if (config.timeLength) {
      timeArg = formatTimeArg(config.timeLength);
    }

    const ffmpegCmd = `ffmpeg ${timeArg} -nostats -i ${input} -vf blackdetect -f null -`;
    log.info(`Executing ffmpeg: ${ffmpegCmd}`);
    const { stdout, stderr } = await execute(ffmpegCmd, cfg.commandLineBuffer);
    log.debug(`${blackDetectLogLabel}: stdout \n ${stdout}`);
    log.debug(`${blackDetectLogLabel}: stderr \n ${stderr}`);

    const collectedBlackParts = stderr.match(/black_start:[\s\d.]*|black_end:[\s\d.]*|black_duration:[\s\d.]*/gm);
    log.debug(`${blackDetectLogLabel}: split regular expression value\n${collectedBlackParts}`);

    if (collectedBlackParts !== null) {
      const pattern = /black_(start|end|duration):[\s\.\d]*,black_(start|end|duration):[\s\.\d]*,black_(start|end|duration):[\s\.\d]*/gm;
      const splitBlackParts = collectedBlackParts.join(',').match(pattern);
      log.debug(`${blackDetectLogLabel}: group split regular expression value\n${splitBlackParts}`);

      if (splitBlackParts !== null) {
        return splitBlackParts.map(fragment => {
          return {
            blackStart: Number(fragment.match(/(?<=black_start:)[\s\d\.]*/gm)),
            blackEnd: Number(fragment.match(/(?<=black_end:)[\s\d\.]*/gm)),
            blackDuration: Number(fragment.match(/(?<=black_duration:)[\s\d\.]*/gm)),
          };
        });
      }
    }

    // in case of any parsing problem
    if (collectedBlackParts === null && stderr.match(/blackdetect/gm)) {
      return stderr.match(/blackdetect.*/gm);
    }
    log.info(`${blackDetectLogLabel}: finish detecting black parts`);
    log.debug(`${blackDetectLogLabel}: output result\n${collectedBlackParts}`);

    // returns null if no parts were found
    return collectedBlackParts;
  } catch (e) {
    e.message = `${blackDetectLogLabel}: error detecting black parts\n${e.message}`;
    throw e;
  }
};

module.exports.detectFreeze = async (input, config) => {
  const freezeDetectLogLabel = cfg.logLabel.freezeDetect;
  try {
    log.info(`${freezeDetectLogLabel}: start detecting freeze parts`);

    let timeArg = '';

    if (config.timeLength) {
      timeArg = formatTimeArg(config.timeLength);
    }

    const ffmpegCmd = `ffmpeg ${timeArg} -nostats -i ${input} -vf freezedetect -f null -`;
    log.info(`Executing ffmpeg: ${ffmpegCmd}`);
    const { stdout, stderr } = await execute(ffmpegCmd, cfg.commandLineBuffer);
    log.debug(`${freezeDetectLogLabel}: stdout \n ${stdout}`);
    log.debug(`${freezeDetectLogLabel}: stderr \n ${stderr}`);

    const collectedFreezeParts = stderr.match(/freeze_start:[\s\d.]*|freeze_end:[\s\d.]*|freeze_duration:[\s\d.]*/gm);
    log.debug(`${freezeDetectLogLabel}: split regular expression value\n${collectedFreezeParts}`);

    if (collectedFreezeParts !== null) {
      const pattern = /freeze_(start|end|duration):[\s\.\d]*,freeze_(start|end|duration):[\s\.\d]*,freeze_(start|end|duration):[\s\.\d]*/gm;
      const splitFreezeParts = collectedFreezeParts.join(',').match(pattern);
      log.debug(`${freezeDetectLogLabel}: group split regular expression value\n${splitFreezeParts}`);

      if (splitFreezeParts !== null) {
        return splitFreezeParts.map(fragment => {
          return {
            freezeStart: Number(fragment.match(/(?<=freeze_start:)[\s\d\.]*/gm)),
            freezeEnd: Number(fragment.match(/(?<=freeze_end:)[\s\d\.]*/gm)),
            freezeDuration: Number(fragment.match(/(?<=freeze_duration:)[\s\d\.]*/gm)),
          };
        });
      }
    }

    // in case of any parsing problem
    if (collectedFreezeParts === null && stderr.match(/freezedetect/gm)) {
      return stderr.match(/freezedetect.*/gm);
    }
    log.info(`${freezeDetectLogLabel}: finish detecting freeze parts`);
    log.debug(`${freezeDetectLogLabel}: output result\n${collectedFreezeParts}`);

    // returns null if no parts were found
    return collectedFreezeParts;
  } catch (e) {
    e.message = `${freezeDetectLogLabel}: error detecting freeze parts\n${e.message}`;
    throw e;
  }
};

module.exports.detectSilence = async (input, config) => {
  const silenceDetectLogLabel = cfg.logLabel.silenceDetect;
  try {
    log.info(`${silenceDetectLogLabel}: start detecting silent parts`);

    let timeArg = '';

    if (config.timeLength) {
      timeArg = formatTimeArg(config.timeLength);
    }

    const ffmpegCmd = `ffmpeg ${timeArg} -nostats -i ${input} -af silencedetect -f null -`;
    log.info(`Executing ffmpeg: ${ffmpegCmd}`);
    const { stdout, stderr } = await execute(ffmpegCmd, cfg.commandLineBuffer);
    log.debug(`${silenceDetectLogLabel}: stdout \n ${stdout}`);
    log.debug(`${silenceDetectLogLabel}: stderr \n ${stderr}`);

    const collectedSilentParts = stderr.match(
      /silence_start:[\s\d.]*|silence_end:[\s\d.]*|silence_duration:[\s\d.]*/gm,
    );
    log.debug(`${silenceDetectLogLabel}: split regular expression value\n${collectedSilentParts}`);

    if (collectedSilentParts !== null) {
      const pattern = /silence_(start|end|duration):[\s\.\d]*,silence_(start|end|duration):[\s\.\d]*,silence_(start|end|duration):[\s\.\d]*/gm;
      const splitSilentParts = collectedSilentParts.join(',').match(pattern);
      log.debug(`${silenceDetectLogLabel}: group split regular expression value\n${splitSilentParts}`);

      if (splitSilentParts !== null) {
        return splitSilentParts.map(fragment => {
          return {
            silenceStart: Number(fragment.match(/(?<=silence_start:)[\s\d\.]*/gm)),
            silenceEnd: Number(fragment.match(/(?<=silence_end:)[\s\d\.]*/gm)),
            silenceDuration: Number(fragment.match(/(?<=silence_duration:)[\s\d\.]*/gm)),
          };
        });
      }
    }

    // in case of any parsing problem
    if (collectedSilentParts === null && stderr.match(/silencedetect/gm)) {
      return stderr.match(/silencedetect.*/gm);
    }
    log.info(`${silenceDetectLogLabel}: finish detecting silent parts`);
    log.debug(`${silenceDetectLogLabel}: output result\n${collectedSilentParts}`);

    // returns null if no parts were found
    return collectedSilentParts;
  } catch (e) {
    e.message = `${silenceDetectLogLabel}: error detecting silent parts\n${e.message}`;
    throw e;
  }
};

module.exports.measureBitplaneNoise = async (input, config) => {
  const bitplaneNoiseLogLabel = cfg.logLabel.bitplaneNoise;
  try {
    const fR = config.frameRate ? `fps=${config.frameRate},` : '';

    let timeArg = '';

    if (config.timeLength) {
      timeArg = formatTimeArg(config.timeLength);
    }

    log.info(`${bitplaneNoiseLogLabel}: start measuring bitplane noise`);
    const ffmpegCmd = `ffmpeg ${timeArg} -i ${input} -vf ${fR}bitplanenoise,metadata=mode=print:file=- -f null -`;
    log.info(`Executing ffmpeg: ${ffmpegCmd}`);
    const { stdout, stderr } = await execute(ffmpegCmd, cfg.commandLineBuffer);
    log.debug(`${bitplaneNoiseLogLabel}: stdout\n ${stdout}`);
    log.debug(`${bitplaneNoiseLogLabel}: stderr\n ${stderr}`);

    const splitOutput = stdout.match(/.*\n.*\n.*\n.*\n/gm);
    log.debug(`${bitplaneNoiseLogLabel}: regular expression value\n ${splitOutput}`);

    const output = [];
    const average = {
      avgBitplaneNoise_O_1: 0,
      avgBitplaneNoise_1_1: 0,
      avgBitplaneNoise_2_1: 0,
    };

    splitOutput.forEach(line => {
      const frame = {
        numberOfSecond: Number(line.match(/(?<=pts_time:).*/gm)[0]),
        bitplaneNoise_O_1: Number(line.match(/(?<=bitplanenoise.0.1=).*/gm)[0]),
        bitplaneNoise_1_1: Number(line.match(/(?<=bitplanenoise.1.1=).*/gm)[0]),
        bitplaneNoise_2_1: Number(line.match(/(?<=bitplanenoise.2.1=).*/gm)[0]),
      };

      output.push(frame);

      average.avgBitplaneNoise_O_1 += frame.bitplaneNoise_O_1;
      average.avgBitplaneNoise_1_1 += frame.bitplaneNoise_1_1;
      average.avgBitplaneNoise_2_1 += frame.bitplaneNoise_2_1;
    });

    for (const value in average) {
      average[value] /= output.length;
    }
    log.info(`${bitplaneNoiseLogLabel}: finish measuring bitplane noise`);
    log.debug(`${bitplaneNoiseLogLabel}: output value is\n${{ average, output }}`);
    return { average, output };
  } catch (e) {
    e.message = `${bitplaneNoiseLogLabel}: error measuring bitplane noise\n${e.message}`;
    throw e;
  }
};

module.exports.measureEntropy = async (input, config) => {
  const entropyLogLabel = cfg.logLabel.entropy;
  try {
    const fR = config.frameRate ? `fps=${config.frameRate},` : '';

    let timeArg = '';

    if (config.timeLength) {
      timeArg = formatTimeArg(config.timeLength);
    }

    log.info(`${entropyLogLabel}: start measuring entropy`);
    const ffmpegCmd = `ffmpeg ${timeArg} -i ${input} -vf ${fR}entropy,metadata=mode=print:file=- -f null -`;
    log.info(`Executing ffmpeg: ${ffmpegCmd}`);
    const { stdout, stderr } = await execute(ffmpegCmd, cfg.commandLineBuffer);
    log.debug(`${entropyLogLabel}: stdout\n ${stdout}`);
    log.debug(`${entropyLogLabel}: stderr\n ${stderr}`);

    const splitOutput = stdout.match(/.*\n.*\n.*\n.*\n.*\n.*\n.*\n/gm);
    log.debug(`${entropyLogLabel}: regular expression value\n ${splitOutput}`);

    const output = [];
    const average = {
      avgEntropyNormal_Y: 0,
      avgNormalizedEntropy_Y: 0,
      avgEntropyNormal_U: 0,
      avgNormalizedEntropy_U: 0,
      avgEntropyNormal_V: 0,
      avgNormalizedEntropy_V: 0,
    };

    splitOutput.forEach(line => {
      const frame = {
        second: Number(line.match(/(?<=pts_time:).*/gm)[0]),
        entropyNormal_Y: Number(line.match(/(?<=entropy.entropy.normal.Y=).*/gm)[0]),
        normalizedEntropy_Y: Number(line.match(/(?<=normalized_entropy.normal.Y=).*/gm)[0]),
        entropyNormal_U: Number(line.match(/(?<=entropy.entropy.normal.U=).*/gm)[0]),
        normalizedEntropy_U: Number(line.match(/(?<=normalized_entropy.normal.U=).*/gm)[0]),
        entropyNormal_V: Number(line.match(/(?<=entropy.entropy.normal.V=).*/gm)[0]),
        normalizedEntropy_V: Number(line.match(/(?<=normalized_entropy.normal.V=).*/gm)[0]),
      };

      output.push(frame);

      average.avgEntropyNormal_Y += frame.entropyNormal_Y;
      average.avgNormalizedEntropy_Y += frame.normalizedEntropy_Y;
      average.avgEntropyNormal_U += frame.entropyNormal_U;
      average.avgNormalizedEntropy_U += frame.normalizedEntropy_U;
      average.avgEntropyNormal_V += frame.entropyNormal_V;
      average.avgNormalizedEntropy_V += frame.normalizedEntropy_V;
    });

    for (const value in average) {
      average[value] /= output.length;
    }
    log.info(`${entropyLogLabel}: finish measuring entropy`);
    log.debug(`${entropyLogLabel}: output value is\n${{ average, output }}`);
    return { average, output };
  } catch (e) {
    e.message = `${entropyLogLabel}: error measuring entropy\n${e.message}`;
    throw e;
  }
};

module.exports.splitVideoIntoImages = async (input, config) => {
  const splitImageLogLabel = cfg.logLabel.splitImage;
  try {
    let timeArg = '';
    let qualityArg = '';

    if (config.timeLength) {
      timeArg = formatTimeArg(config.timeLength);
    }

    if (config.splitImages.imageExtension === 'jpg') {
      qualityArg = `-qscale ${config.splitImages.jpegQuality ? config.splitImages.jpegQuality : 1} `;
    }

    const tmpThumbTemplate = path.join(config.frameExtractionTempDir, `thumb%04d.${config.splitImages.imageExtension}`);

    const frameRateLog = config.frameRate ? `with ${config.frameRate} frame rate ` : '';

    log.info(
      `${splitImageLogLabel}: splitting ${input} into ${config.splitImages.imageExtension} files ${frameRateLog}for ${config.timeLength} second period`,
    );

    const frameRate = config.frameRate ? `-vf fps=${config.frameRate}` : '';

    const ffmpegSplitCommand = `ffmpeg -i ${input} ${timeArg} ${frameRate}-hide_banner ${qualityArg}${tmpThumbTemplate}`;

    log.info(`Executing ffmpeg: ${ffmpegSplitCommand}`);

    await execute(ffmpegSplitCommand, cfg.commandLineBuffer);
  } catch (e) {
    e.message = `${splitImageLogLabel}: error splitting video into images\n${e.message}`;
    throw e;
  }
};

module.exports.recordVideo = async (input, config) => {
  const recordVideoLabel = cfg.logLabel.recordVideo;
  try {
    let timeArg = '';

    if (config.timeLength) {
      timeArg = formatTimeArg(config.timeLength);
    }

    const output = path.join(cfg.recordVideoTempDir, `eyetropy_recorded_video_${Date.now()}.mp4`);

    log.info(
      `${recordVideoLabel}: recording ${input} into ${cfg.recordVideoTempDir} for ${config.timeLength} second period`,
    );

    const ffmpegRecordVideoCommand = `ffmpeg -i ${input} ${timeArg} -c copy ${output}`;

    log.info(`Executing ffmpeg: ${ffmpegRecordVideoCommand}`);

    await execute(ffmpegRecordVideoCommand, cfg.commandLineBuffer);

    log.info(`Successfully recorded ${input} as ${output}`);

    return { source: input, savedVideo: output };
  } catch (e) {
    e.message = `${recordVideoLabel}: error recording video \n${e.message}`;
    throw e;
  }
};

function formatTimeArg(timeLength) {
  return `-t ${new Date(timeLength * 1000).toISOString().substr(11, 8)}`;
}
