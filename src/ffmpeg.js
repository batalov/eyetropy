const ffmpeg = require('fluent-ffmpeg');
const {promisify} = require('util');
const {exec} = require('child_process');
const execute = promisify(exec);
const maxBuffer = {maxBuffer: 1024 * 10000};
const log = require('loglevel');

module.exports.getMetaData = async (input) => {
    try {
        log.info('[meta-data]: start collecting meta data');
        const ffprobe = promisify(ffmpeg.ffprobe);
        const output = await ffprobe(input);
        log.info('[meta-data]: finish collecting meta data \n');
        log.debug(`[meta-data]: output \n ${output}`);
        return output
    } catch (e) {
        e.message = `[meta-data]: error collecting metadata\n${e.message}`;
        throw e
    }
};

module.exports.getVmafMotionAvg = async (input, timeLength) => {
    try {
        log.info('[VMAF]: start evaluating VMAF Motion Average');
        const timeArg = formatTimeArg(timeLength);
        const {stdout, stderr} = await execute(`ffmpeg ${timeArg} -i ${input} -vf vmafmotion -f null -`, maxBuffer);
        const vmafMotionAvg = Number(stderr.match(/(?<=VMAF Motion avg: ).*/gm)[0]);
        log.info('[VMAF]: finish evaluating VMAF Motion Average');
        log.debug(`[VMAF]: stdout output \n ${stdout}`);
        log.debug(`[VMAF]: stderr output \n ${stderr}`);
        log.debug(`[VMAF]: value ${vmafMotionAvg}`);
        return vmafMotionAvg
    } catch (e) {
        e.message = `[VMAF]: error evaluating VMAF Motion Average\n${e.message}`;
        throw e
    }
};

module.exports.detectBlack = async (input, timeLength) => {
    try {
        log.info('[black-detect]: start detecting black periods');
        const timeArg = formatTimeArg(timeLength);
        const {stdout, stderr} = await execute(`ffmpeg ${timeArg} -nostats -i ${input} -vf blackdetect -f null -`, maxBuffer);
        const fragments = stderr.match(/black_start[:|\d|\.\s|black_end|black_duration]*/gm);
        log.debug(`[black-detect]: stdout \n ${stdout}`);
        log.debug(`[black-detect]: stderr \n ${stderr}`);
        log.debug(`[black-detect]: regular expression value\n${fragments}`);

        if (fragments !== null) {
            return fragments.map((fragment) => {
                return {
                    blackStart: Number(fragment.match(/(?<=black_start:)[\d\.]*/gm)),
                    blackEnd: Number(fragment.match(/(?<=black_end:)[\d\.]*/gm)),
                    blackDuration: Number(fragment.match(/(?<=black_duration:)[\d\.]*/gm))
                }
            });
        }

        // in case of any parsing problem output the whole stderr
        if (fragments === null && stderr.match(/blackdetect/gm)) {
            return stderr
        }
        log.info('[black-detect]: finish detecting black periods');
        log.debug(`[black-detect]: output result\n${fragments}`);
        return fragments
    } catch (e) {
        e.message = `[black-detect]: error detecting black periods\n${e.message}`;
        throw e
    }
};

module.exports.detectFreeze = async (input, timeLength) => {
    try {
        log.info('[freeze-detect]: start detecting freeze periods');
        const timeArg = formatTimeArg(timeLength);
        const {stdout, stderr} = await execute(`ffmpeg ${timeArg} -nostats -i ${input} -vf freezedetect -f null -`, maxBuffer);
        const pattern = /freeze_start:\s[\d\.]*\n\[freezedetect @ [\dxabcdef]*]\slavfi.freezedetect.freeze_duration:\s[\d\.]*\n\[freezedetect @ [\dxabcdef]*]\slavfi.freezedetect.freeze_end:\s[\d\.]*/gm;
        const fragments = stderr.match(pattern);
        log.debug(`[freeze-detect]: stdout \n ${stdout}`);
        log.debug(`[freeze-detect]: stderr \n ${stderr}`);
        log.debug(`[freeze-detect]: regular expression value\n${fragments}`);

        if (fragments !== null) {
            return fragments.map((fragment) => {
                return {
                    freezeStart: Number(fragment.match(/(?<=freeze_start:\s)[\d\.]*/gm)),
                    freezeEnd: Number(fragment.match(/(?<=freeze_end:\s)[\d\.]*/gm)),
                    freezeDuration: Number(fragment.match(/(?<=freeze_duration:\s)[\d\.]*/gm))
                }
            });
        }

        // in case of any parsing problem output the whole stderr
        if (fragments === null && stderr.match(/freezedetect/gm)) {
            return stderr
        }
        log.info('[freeze-detect]: finish detecting freeze periods');
        log.debug(`[freeze-detect]: output result\n${fragments}`);
        return fragments
    } catch (e) {
        e.message = `[freeze-detect]: error detecting freeze periods\n${e.message}`;
        throw e
    }
};

module.exports.detectSilence = async (input, timeLength) => {
    try {
        log.info('[silence-detect]: start detecting silent periods');
        const timeArg = formatTimeArg(timeLength);
        const {stdout, stderr} = await execute(`ffmpeg ${timeArg} -nostats -i ${input} -af silencedetect -f null -`, maxBuffer);
        const pattern = /silence_start:\s[\d\.]*\n\[silencedetect @ [\dxabcdef]*]\ssilence_end:\s[\d\.]*\s\|\ssilence_duration:\s[\d\.]*/gm;
        const fragments = stderr.match(pattern);
        log.debug(`[silence-detect]: stdout \n ${stdout}`);
        log.debug(`[silence-detect]: stderr \n ${stderr}`);
        log.debug(`[silence-detect]: regular expression value\n${fragments}`);

        if (fragments !== null) {
            return fragments.map((fragment) => {
                return {
                    silenceStart: Number(fragment.match(/(?<=silence_start:\s)[\d\.]*/gm)),
                    silenceEnd: Number(fragment.match(/(?<=silence_end:\s)[\d\.]*/gm)),
                    silenceDuration: Number(fragment.match(/(?<=silence_duration:\s)[\d\.]*/gm))
                }
            });
        }

        // in case of any parsing problem output the whole stderr
        if (fragments === null && stderr.match(/silencedetect/gm)) {
            return stderr
        }
        log.info('[silence-detect]: finish detecting silent periods');
        log.debug(`[silence-detect]: output result\n${fragments}`);
        return fragments
    } catch (e) {
        e.message = `[silence-detect]: error detecting silent periods\n${e.message}`;
        throw e
    }
};

module.exports.measureBitplaneNoise = async (input, frameRate, timeLength) => {
    try {
        const fR = frameRate ? `fps=${frameRate},` : '';
        const timeArg = formatTimeArg(timeLength);
        log.info('[bitplane-noise]: start measuring bitplane noise');
        const {stdout, stderr} = await execute(`ffmpeg ${timeArg} -i ${input} -vf ${fR}bitplanenoise,metadata=mode=print:file=- -f null -`, maxBuffer);
        log.debug(`[bitplane-noise]: stdout\n ${stdout}`);
        log.debug(`[bitplane-noise]: stderr\n ${stderr}`);

        const splitOutput = stdout.match(/.*\n.*\n.*\n.*\n/gm);
        log.debug(`[bitplane-noise]: regular expression value\n ${splitOutput}`);

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
        log.info('[bitplane-noise]: finish measuring bitplane noise');
        log.debug(`[bitplane-noise]: output value is\n${{average, output}}`);
        return {average, output}
    } catch (e) {
        e.message = `[bitplane-noise]: error measuring bitplane noise\n${e.message}`;
        throw e
    }
};

module.exports.measureEntropy = async (input, frameRate, timeLength) => {
    try {
        const fR = frameRate ? `fps=${frameRate},` : '';
        const timeArg = formatTimeArg(timeLength);
        log.info('[entropy]: start measuring entropy');
        const {stdout, stderr} = await execute(`ffmpeg ${timeArg} -i ${input} -vf ${fR}entropy,metadata=mode=print:file=- -f null -`, maxBuffer);
        log.debug(`[entropy]: stdout\n ${stdout}`);
        log.debug(`[entropy]: stderr\n ${stderr}`);

        const splitOutput = stdout.match(/.*\n.*\n.*\n.*\n.*\n.*\n.*\n/gm);
        log.debug(`[entropy]: regular expression value\n ${splitOutput}`);

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
        log.info('[entropy]: finish measuring entropy');
        log.debug(`[entropy]: output value is\n${{average, output}}`);
        return {average, output}
    } catch (e) {
        e.message = `[entropy]: error measuring entropy\n${e.message}`;
        throw e
    }
};

module.exports.splitVideoIntoJpgImages = async (input, frameRate, timeLength) => {
    try {
        const timeArg = formatTimeArg(timeLength);
        log.info(`[split-image]: splitting ${input} into jpeg files with ${frameRate} frame rate for ${timeLength} second period`);
        await execute(`ffmpeg ${timeArg} -i ${input} -vf fps=${frameRate} -hide_banner ./tmp/thumb%04d.jpg`, maxBuffer);
    } catch (e) {
        e.message = `[split-image]: error splitting video into images\n${e.message}`;
        throw e
    }
};

function formatTimeArg(timeLength) {
    return `-t ${new Date(timeLength * 1000).toISOString().substr(11, 8)}`;
}
