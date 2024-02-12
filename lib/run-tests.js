'use strict';

const runCLI = require('jest').runCLI;
const BbPromise = require('bluebird');
const { setEnv } = require('./utils');

const runTests = (serverless, options, conf) =>
  new BbPromise((resolve, reject) => {
    const functionName = options.f || options.function;
    const allFunctions = serverless.service.getAllFunctions();
    const config = Object.assign({ testEnvironment: 'node' }, conf);

    // const vars = new serverless.classes.Variables(serverless);
    // vars.populateService(options);
    allFunctions.forEach(name => setEnv(serverless, name));

    if (!config.testRegex) {
      if (functionName) {
        if (allFunctions.indexOf(functionName) >= 0) {
          setEnv(serverless, functionName);
          Object.assign(config, { testRegex: `${functionName}\\.test\\.[jt]s$` });
        } else {
          return reject(`Function "${functionName}" not found`);
        }
      } else {
        const functionsRegex = allFunctions.map(name => `${name}\\.test\\.[jt]s$`).join('|');
        Object.assign(config, { testRegex: functionsRegex });
      }
    }

    // eslint-disable-next-line dot-notation
    process.env['SERVERLESS_TEST_ROOT'] = serverless.config.servicePath;

    return runCLI(config, [serverless.config.servicePath])
      .then((output) => {
        if (output.results.success) {
          resolve(output);
        } else {
          reject(output.results);
        }
      })
      .catch(e => reject(e));
  });

module.exports = runTests;
