'use strict';

const path = require('path');
const ejs = require('ejs');
const fse = require('fs-extra');
const utils = require('./utils');
const BbPromise = require('bluebird');

const writeFile = BbPromise.promisify(fse.writeFile);

const testTemplateFile = path.join('templates', 'test-template.ejs');

const createTest = (serverless, options) => {
  const functionName = options.f || options.function;
  if (!serverless.service.functions.hasOwnProperty(functionName)) {
    throw new Error(`Error while creating test. Function "${functionName}" is undefined.`);
  }

  const functionItem = serverless.service.functions[functionName];
  const functionPath = path.parse(functionItem.handler);
  const testFilePath = path.join(functionPath.dir, `${functionName}.test.js`); // @todo regex e.g.*.test.js from config

  const testConfig = {
    functionName,
    functionItem,
    functionPath,
    testFilePath
  };

  testfileNotExists(testConfig)
    .then(() => writeTestfile(serverless, options, testConfig))
    .then(() => serverless.cli.log(`serverless-jest-plugin: created ${testFilePath}`))
    .catch((error) => {
      throw new Error(error)
    });
};

const writeTestfile = (serverless, options, testConfig) => {
  const templateFile = path.join(__dirname, testTemplateFile);
  const templateString = utils.getTemplateFromFile(templateFile);
  const content = ejs.render(templateString, {
    functionName: testConfig.functionName,
    functionPath: path.join('.', testConfig.functionPath.name),
    handlerName: testConfig.functionPath.ext.substr(1),
  });

  return writeFile(testConfig.testFilePath, content);
};

const testfileNotExists = (testConfig) => new BbPromise((resolve, reject) => {
  fse.exists(testConfig.testFilePath, (exists) => {
    if(exists) {
      return reject(`File ${testConfig.testFilePath} already exists`);
    }

    return resolve();
  });
});

module.exports = createTest;