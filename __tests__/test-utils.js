'use strict';

const fse = require('fs-extra');
const os = require('os');
const crypto = require('crypto');
const path = require('path');
const spawn = require('child_process').spawn;

const replaceTextInFile = (filePath, subString, newSubString) => {
  const fileContent = fse.readFileSync(path.join(process.cwd(), filePath)).toString();
  fse.writeFileSync(filePath, fileContent.replace(subString, newSubString));
};

const getTmpDirPath = () => path.join(os.tmpdir(),
  'tmpdirs-serverless-jest-plugin',
  'serverless-jest-plugin',
  crypto.randomBytes(8).toString('hex'));

const spawnPromise = (serverlessExec, params) =>
  new Promise((resolve, reject) => {
    const test = spawn(serverlessExec, params.split(' '));
    let stdout = '';
    let stderr = '';

    test.stdout.on('data', (data) => {
      stdout += data;
    });

    test.stderr.on('data', (data) => {
      stderr += data;
    });

    test.on('close', (code) => {
      if (code > 0) {
        return reject(code);
      }

      return resolve({ stdout, stderr });
    });
  });

module.exports = {
  replaceTextInFile,
  getTmpDirPath,
  spawnPromise,
};
