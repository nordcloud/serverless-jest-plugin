'use strict';

const BbPromise = require('bluebird');
const path = require('path');
const fse = require('fs-extra');

const defaultTestsRootFolder = 'test'; // default test folder used for tests

function getTestsFolder(testsRootFolder) {
  return testsRootFolder || defaultTestsRootFolder;
}

function getTestFilePath(funcName, testsRootFolder) {
  return path.join(getTestsFolder(testsRootFolder), `${funcName.replace(/.*\//g, '')}.js`);
}

// Create the test folder
function createTestFolder(testsRootFolder) {
  return new BbPromise((resolve, reject) => {
    const testsFolder = getTestsFolder(testsRootFolder);
    fse.exists(testsFolder, (exists) => {
      if (exists) {
        return resolve(testsFolder);
      }
      fse.mkdir(testsFolder, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve(testsFolder);
      });
      return null;
    });
  });
}

function getTemplateFromFile(templateFilenamePath) {
  return fse.readFileSync(templateFilenamePath, 'utf-8');
}

function funcNameFromPath(filePath) {
  const data = path.parse(filePath);

  return data.name;
}

function setEnv(serverless, funcName) {
  const serviceVars = serverless.service.provider.environment || {};
  const functionVars =
    serverless.service.functions[funcName] ?
      serverless.service.functions[funcName].environment :
      {};
  return Object.assign(process.env, serviceVars, functionVars);
}

module.exports = {
  getTestsFolder,
  getTestFilePath,
  createTestFolder,
  getTemplateFromFile,
  funcNameFromPath,
  setEnv,
};
