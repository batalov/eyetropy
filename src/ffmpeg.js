const ffmpeg = require('fluent-ffmpeg');
const {promisify} = require('util');
const {exec} = require('child_process');
const execute = promisify(exec);
const maxBuffer = {maxBuffer: 1024 * 10000};
const log = require('loglevel');
const {cfg} = require('../config/config');
const path = require('path');

module.exports.getMetaData = async (input) => {
    try {
        log.info(`${cfg.logLabel.metaData}: start collecting meta data`);
        const ffprobe = promisify(ffmpeg.ffprobe);
        const output = await ffprobe(input);
        log.info(`${cfg.logLabel.metaData}: finish collecting meta data \n`);
        log.debug(`${cfg.logLabel.metaData}: output \n ${JSON.stringify(output)}`);
        return output
    } catch (e) {
        e.message = `${cfg.logLabel.metaData}: error collecting metadata\n${e.message}`;
        throw e
    }
};

module.exports.getVmafMotionAvg = async (input, timeLength) => {
    try {
        log.info(`${cfg.logLabel.vmaf}: start evaluating VMAF Motion Average`);
        const timeArg = formatTimeArg(timeLength);
        const {stdout, stderr} = await execute(`ffmpeg ${timeArg} -i ${input} -vf vmafmotion -f null -`, maxBuffer);
        const vmafMotionAvg = Number(stderr.match(/(?<=VMAF Motion avg: ).*/gm)[0]);
        log.info(`${cfg.logLabel.vmaf}: finish evaluating VMAF Motion Average`);
        log.debug(`${cfg.logLabel.vmaf}: stdout output \n ${stdout}`);
        log.debug(`${cfg.logLabel.vmaf}: stderr output \n ${stderr}`);
        log.debug(`${cfg.logLabel.vmaf}: value ${vmafMotionAvg}`);
        return vmafMotionAvg
    } catch (e) {
        e.message = `${cfg.logLabel.vmaf}: error evaluating VMAF Motion Average\n${e.message}`;
        throw e
    }
};

module.exports.detectBlack = async (input, timeLength) => {
    try {
        log.info(`${cfg.logLabel.blackDetect}: start detecting black parts`);
        const timeArg = formatTimeArg(timeLength);
        const {stdout, stderr} = await execute(`ffmpeg ${timeArg} -nostats -i ${input} -vf blackdetect -f null -`, maxBuffer);
        log.debug(`${cfg.logLabel.blackDetect}: stdout \n ${stdout}`);
        log.debug(`${cfg.logLabel.blackDetect}: stderr \n ${stderr}`);

        const collectedBlackParts = stderr.match(/black_start:[\s\d.]*|black_end:[\s\d.]*|black_duration:[\s\d.]*/gm);
        log.debug(`${cfg.logLabel.blackDetect}: split regular expression value\n${collectedBlackParts}`);

        if (collectedBlackParts !== null) {
            const pattern = /black_(start|end|duration):[\s\.\d]*,black_(start|end|duration):[\s\.\d]*,black_(start|end|duration):[\s\.\d]*/gm;
            const splitBlackParts = collectedBlackParts.join(',').match(pattern);
            log.debug(`${cfg.logLabel.blackDetect}: group split regular expression value\n${splitBlackParts}`);

            if (splitBlackParts !== null) {
                return splitBlackParts.map((fragment) => {
                    return {
                        blackStart: Number(fragment.match(/(?<=black_start:)[\s\d\.]*/gm)),
                        blackEnd: Number(fragment.match(/(?<=black_end:)[\s\d\.]*/gm)),
                        blackDuration: Number(fragment.match(/(?<=black_duration:)[\s\d\.]*/gm))
                    }
                });
            }
        }

        // in case of any parsing problem
        if (collectedBlackParts === null && stderr.match(/blackdetect/gm)) {
            return stderr.match(/blackdetect.*/gm);
        }
        log.info(`${cfg.logLabel.blackDetect}: finish detecting black parts`);
        log.debug(`${cfg.logLabel.blackDetect}: output result\n${collectedBlackParts}`);

        // returns null if no parts were found
        return collectedBlackParts
    } catch (e) {
        e.message = `${cfg.logLabel.blackDetect}: error detecting black parts\n${e.message}`;
        throw e
    }
};

module.exports.detectFreeze = async (input, timeLength) => {
    try {
        log.info(`${cfg.logLabel.freezeDetect}: start detecting freeze parts`);
        const timeArg = formatTimeArg(timeLength);
        const {stdout, stderr} = await execute(`ffmpeg ${timeArg} -nostats -i ${input} -vf freezedetect -f null -`, maxBuffer);
        log.debug(`${cfg.logLabel.freezeDetect}: stdout \n ${stdout}`);
        log.debug(`${cfg.logLabel.freezeDetect}: stderr \n ${stderr}`);

        const collectedFreezeParts = stderr.match(/freeze_start:[\s\d.]*|freeze_end:[\s\d.]*|freeze_duration:[\s\d.]*/gm);
        log.debug(`${cfg.logLabel.freezeDetect}: split regular expression value\n${collectedFreezeParts}`);

        if (collectedFreezeParts !== null) {
            const pattern = /freeze_(start|end|duration):[\s\.\d]*,freeze_(start|end|duration):[\s\.\d]*,freeze_(start|end|duration):[\s\.\d]*/gm;
            const splitFreezeParts = collectedFreezeParts.join(',').match(pattern);
            log.debug(`${cfg.logLabel.freezeDetect}: group split regular expression value\n${splitFreezeParts}`);

            if (splitFreezeParts !== null) {
                return splitFreezeParts.map((fragment) => {
                    return {
                        freezeStart: Number(fragment.match(/(?<=freeze_start:)[\s\d\.]*/gm)),
                        freezeEnd: Number(fragment.match(/(?<=freeze_end:)[\s\d\.]*/gm)),
                        freezeDuration: Number(fragment.match(/(?<=freeze_duration:)[\s\d\.]*/gm))
                    }
                });
            }
        }

        // in case of any parsing problem
        if (collectedFreezeParts === null && stderr.match(/freezedetect/gm)) {
            return stderr.match(/freezedetect.*/gm);
        }
        log.info(`${cfg.logLabel.freezeDetect}: finish detecting freeze parts`);
        log.debug(`${cfg.logLabel.freezeDetect}: output result\n${collectedFreezeParts}`);

        // returns null if no parts were found
        return collectedFreezeParts
    } catch (e) {
        e.message = `${cfg.logLabel.freezeDetect}: error detecting freeze parts\n${e.message}`;
        throw e
    }
};

module.exports.detectSilence = async (input, timeLength) => {
    try {
        log.info(`${cfg.logLabel.silenceDetect}: start detecting silent parts`);
        const timeArg = formatTimeArg(timeLength);
        const {stdout, stderr} = await execute(`ffmpeg ${timeArg} -nostats -i ${input} -af silencedetect -f null -`, maxBuffer);
        log.debug(`${cfg.logLabel.silenceDetect}: stdout \n ${stdout}`);
        log.debug(`${cfg.logLabel.silenceDetect}: stderr \n ${stderr}`);

        const collectedSilentParts = stderr.match(/silence_start:[\s\d.]*|silence_end:[\s\d.]*|silence_duration:[\s\d.]*/gm);
        log.debug(`${cfg.logLabel.silenceDetect}: split regular expression value\n${collectedSilentParts}`);

        if (collectedSilentParts !== null) {
            const pattern = /silence_(start|end|duration):[\s\.\d]*,silence_(start|end|duration):[\s\.\d]*,silence_(start|end|duration):[\s\.\d]*/gm;
            const splitSilentParts = collectedSilentParts.join(',').match(pattern);
            log.debug(`${cfg.logLabel.silenceDetect}: group split regular expression value\n${splitSilentParts}`);

            if (splitSilentParts !== null) {
                return splitSilentParts.map((fragment) => {
                    return {
                        silenceStart: Number(fragment.match(/(?<=silence_start:)[\s\d\.]*/gm)),
                        silenceEnd: Number(fragment.match(/(?<=silence_end:)[\s\d\.]*/gm)),
                        silenceDuration: Number(fragment.match(/(?<=silence_duration:)[\s\d\.]*/gm))
                    }
                });
            }
        }

        // in case of any parsing problem
        if (collectedSilentParts === null && stderr.match(/silencedetect/gm)) {
            return stderr.match(/silencedetect.*/gm);
        }
        log.info(`${cfg.logLabel.silenceDetect}: finish detecting silent parts`);
        log.debug(`${cfg.logLabel.silenceDetect}: output result\n${collectedSilentParts}`);

        // returns null if no parts were found
        return collectedSilentParts
    } catch (e) {
        e.message = `${cfg.logLabel.silenceDetect}: error detecting silent parts\n${e.message}`;
        throw e
    }
};

module.exports.measureBitplaneNoise = async (input, frameRate, timeLength) => {
    try {
        const fR = frameRate ? `fps=${frameRate},` : '';
        const timeArg = formatTimeArg(timeLength);
        log.info(`${cfg.logLabel.bitplaneNoise}: start measuring bitplane noise`);
        const {stdout, stderr} = await execute(`ffmpeg ${timeArg} -i ${input} -vf ${fR}bitplanenoise,metadata=mode=print:file=- -f null -`, maxBuffer);
        log.debug(`${cfg.logLabel.bitplaneNoise}: stdout\n ${stdout}`);
        log.debug(`${cfg.logLabel.bitplaneNoise}: stderr\n ${stderr}`);

        const splitOutput = stdout.match(/.*\n.*\n.*\n.*\n/gm);
        log.debug(`${cfg.logLabel.bitplaneNoise}: regular expression value\n ${splitOutput}`);

        const output = [];
        const average = {
            avgBitplaneNoise_O_1: 0,
            avgBitplaneNoise_1_1: 0,
            avgBitplaneNoise_2_1: 0,
        };

        splitOutput.forEach((line) => {
            const frame = {
                second: Number(line.match(/(?<=pts_time:).*/gm)[0]),
                bitplaneNoise_O_1: Number(line.match(/(?<=bitplanenoise.0.1=).*/gm)[0]),
                bitplaneNoise_1_1: Number(line.match(/(?<=bitplanenoise.1.1=).*/gm)[0]),
                bitplaneNoise_2_1: Number(line.match(/(?<=bitplanenoise.2.1=).*/gm)[0]),
            };

            output.push(frame);

            average.avgBitplaneNoise_O_1 = average.avgBitplaneNoise_O_1 + frame.bitplaneNoise_O_1;
            average.avgBitplaneNoise_1_1 = average.avgBitplaneNoise_1_1 + frame.bitplaneNoise_1_1;
            average.avgBitplaneNoise_2_1 = average.avgBitplaneNoise_2_1 + frame.bitplaneNoise_2_1;
        });

        for (const value in average) {
            average[value] = average[value] / output.length;
        }
        log.info(`${cfg.logLabel.bitplaneNoise}: finish measuring bitplane noise`);
        log.debug(`${cfg.logLabel.bitplaneNoise}: output value is\n${{average, output}}`);
        return {average, output}
    } catch (e) {
        e.message = `${cfg.logLabel.bitplaneNoise}: error measuring bitplane noise\n${e.message}`;
        throw e
    }
};

module.exports.measureEntropy = async (input, frameRate, timeLength) => {
    try {
        const fR = frameRate ? `fps=${frameRate},` : '';
        const timeArg = formatTimeArg(timeLength);
        log.info(`${cfg.logLabel.entropy}: start measuring entropy`);
        const {stdout, stderr} = await execute(`ffmpeg ${timeArg} -i ${input} -vf ${fR}entropy,metadata=mode=print:file=- -f null -`, maxBuffer);
        log.debug(`${cfg.logLabel.entropy}: stdout\n ${stdout}`);
        log.debug(`${cfg.logLabel.entropy}: stderr\n ${stderr}`);

        const splitOutput = stdout.match(/.*\n.*\n.*\n.*\n.*\n.*\n.*\n/gm);
        log.debug(`${cfg.logLabel.entropy}: regular expression value\n ${splitOutput}`);

        const output = [];
        const average = {
            avgEntropyNormal_Y: 0,
            avgNormalizedEntropy_Y: 0,
            avgEntropyNormal_U: 0,
            avgNormalizedEntropy_U: 0,
            avgEntropyNormal_V: 0,
            avgNormalizedEntropy_V: 0,
        };

        splitOutput.forEach((line) => {
            const frame = {
                second: Number(line.match(/(?<=pts_time:).*/gm)[0]),
                entropyNormal_Y: Number(line.match(/(?<=entropy.entropy.normal.Y=).*/gm)[0]),
                normalizedEntropy_Y: Number(line.match(/(?<=normalized_entropy.normal.Y=).*/gm)[0]),
                entropyNormal_U: Number(line.match(/(?<=entropy.entropy.normal.U=).*/gm)[0]),
                normalizedEntropy_U: Number(line.match(/(?<=normalized_entropy.normal.U=).*/gm)[0]),
                entropyNormal_V: Number(line.match(/(?<=entropy.entropy.normal.V=).*/gm)[0]),
                normalizedEntropy_V: Number(line.match(/(?<=normalized_entropy.normal.V=).*/gm)[0])
            };

            output.push(frame);

            average.avgEntropyNormal_Y = average.avgEntropyNormal_Y + frame.entropyNormal_Y;
            average.avgNormalizedEntropy_Y = average.avgNormalizedEntropy_Y + frame.normalizedEntropy_Y;
            average.avgEntropyNormal_U = average.avgEntropyNormal_U + frame.entropyNormal_U;
            average.avgNormalizedEntropy_U = average.avgNormalizedEntropy_U + frame.normalizedEntropy_U;
            average.avgEntropyNormal_V = average.avgEntropyNormal_V + frame.entropyNormal_V;
            average.avgNormalizedEntropy_V = average.avgNormalizedEntropy_V + frame.normalizedEntropy_V;
        });

        for (const value in average) {
            average[value] = average[value] / output.length;
        }
        log.info(`${cfg.logLabel.entropy}: finish measuring entropy`);
        log.debug(`${cfg.logLabel.entropy}: output value is\n${{average, output}}`);
        return {average, output}
    } catch (e) {
        e.message = `${cfg.logLabel.entropy}: error measuring entropy\n${e.message}`;
        throw e
    }
};

module.exports.splitVideoIntoJpgImages = async (input, frameRate, timeLength) => {
    try {
        const timeArg = formatTimeArg(timeLength);
        const tmpThumbTemplate = path.normalize('./tmp/') + 'thumb%04d.jpg';
        log.info(`${cfg.logLabel.splitImage}: splitting ${input} into jpeg files with ${frameRate} frame rate for ${timeLength} second period`);
        await execute(`ffmpeg ${timeArg} -i ${input} -vf fps=${frameRate} -hide_banner ${tmpThumbTemplate}`, maxBuffer);
    } catch (e) {
        e.message = `${cfg.logLabel.splitImage}: error splitting video into images\n${e.message}`;
        throw e
    }
};

function formatTimeArg(timeLength) {
    return `-t ${new Date(timeLength * 1000).toISOString().substr(11, 8)}`;
}
