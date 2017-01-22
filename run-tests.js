'use strict';

const jest = require('jest');
const path = require('path');
const BbPromise = require('bluebird');

const runTests = (serverless, options) => new BbPromise((resolve, reject) => {
  const functionName = options.function;
  const allFunctions = serverless.service.getAllFunctions();
  const config = {
    testEnvironment: 'node',
  };

  if (functionName) {
    if(allFunctions.indexOf(functionName) >= 0) {
      Object.assign(config, { testRegex: `${functionName}\\.test\\.js` });
    } else {
      return reject(`Function "${functionName}" not found`);
    }
  } else {
    const functionsRegex = allFunctions.map((name) => {
      return `${name}\\.test\\.js`;
    }).join('|');
    Object.assign(config, { testRegex: functionsRegex });
  }

  jest.runCLI({ config },
    serverless.config.servicePath,
    (success) => {
      return resolve(success);
    });
});

module.exports = runTests;