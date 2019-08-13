const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const log = require('loglevel');
const rimraf = require('rimraf');
const promise = require('bluebird');
const { cfg } = require('../config/config');

module.exports.makeDir = function(dir) {
  try {
    log.info(`${cfg.logLabel.mkDir}: start checking directory for existence`);
    if (fs.existsSync(dir)) {
      log.info(`${cfg.logLabel.mkDir}: directory ${dir} exists`);
    } else {
      log.info(`${cfg.logLabel.mkDir}: directory ${dir} does not exist, making dir ${dir}`);
      fs.mkdirSync(dir);
    }
  } catch (e) {
    e.message = `${cfg.logLabel.mkDir}: error making directory \n${e.message}`;
    throw e;
  }
};

module.exports.cleanUpDir = async function(dir) {
  try {
    if (fs.existsSync(dir)) {
      log.info(`${cfg.logLabel.cleanUp}: start cleanup for ${dir}`);
      const files = await readdir(dir);
      files.forEach(async file => {
        await unlink(path.join(dir, file));
      });
      log.info(`${cfg.logLabel.cleanUp}: finish cleanup process\n`);
    }
  } catch (e) {
    e.message = `${cfg.logLabel.cleanUp}: error cleaning up directory\n${e.message}`;
    throw e;
  }
};

module.exports.setLogLevel = function(logLevel) {
  if (typeof logLevel === 'string' && logLevel.match(/trace|debug|info|warn|error/gm)) {
    log.setLevel(logLevel);
  } else {
    log.setLevel('info');
  }
};

module.exports.removeDir = async function(dir) {
  try {
    log.info(`${cfg.logLabel.rmDir}: removing dir ${dir}`);
    const rmrf = promise.promisifyAll(rimraf);
    await rmrf(dir, () => {});
  } catch (e) {
    e.message = `${cfg.logLabel.rmDir}: error removing directory\n${e.message}`;
    throw e;
  }
};
