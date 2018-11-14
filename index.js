'use strict';

const BbPromise = require('bluebird');
const lambdaWrapper = require('lambda-wrapper');

const createFunction = require('./lib/create-function');
const createTest = require('./lib/create-test');
const runTests = require('./lib/run-tests');

class ServerlessJestPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.service = serverless.service || {};
    this.config = (this.service.custom && this.service.custom.jest) || {};
    this.options = options;
    this.commands = {
      create: {
        commands: {
          test: {
            usage: 'Create jest tests for service / function',
            lifecycleEvents: ['test'],
            options: {
              function: {
                usage: 'Name of the function',
                shortcut: 'f',
                required: true,
              },
              path: {
                usage: 'Path for the tests',
                shortcut: 'p',
              },
            },
          },
          function: {
            usage: 'Create a function into the service',
            lifecycleEvents: ['create'],
            options: {
              function: {
                usage: 'Name of the function',
                shortcut: 'f',
                required: true,
              },
              handler: {
                usage: 'Handler for the function (e.g. --handler my-function/index.handler)',
                required: true,
              },
              path: {
                usage: 'Path for the tests (e.g. --path tests)',
                shortcut: 'p',
              },
            },
          },
        },
      },
      invoke: {
        usage: 'Invoke jest tests for service / function',
        commands: {
          test: {
            usage: 'Invoke test(s)',
            lifecycleEvents: ['test'],
            options: {
              function: {
                usage: 'Name of the function',
                shortcut: 'f',
              },
              reporter: {
                usage: 'Jest reporter to use',
                shortcut: 'R',
              },
              'reporter-options': {
                usage: 'Options for jest reporter',
                shortcut: 'O',
              },
              path: {
                usage: 'Path for the tests for running tests in other than default "test" folder',
              },
            },
          },
        },
      },
    };

    this.hooks = {
      'create:test:test': () =>
        BbPromise.bind(this).then(() => createTest(this.serverless, this.options)),
      'invoke:test:test': () =>
        BbPromise.bind(this).then(() => runTests(this.serverless, this.options, this.config)),
      'create:function:create': () =>
        BbPromise.bind(this)
          .then(() => createFunction(this.serverless, this.options))
          .then(() => createTest(this.serverless, this.options)),
    };
  }
}

module.exports = ServerlessJestPlugin;
module.exports.lambdaWrapper = lambdaWrapper;

// Match `serverless-mocha-plugin`
module.exports.getWrapper = (modName, modPath, handler) => {
  // TODO: make this fetch the data from serverless.yml

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const mod = require(process.env.SERVERLESS_TEST_ROOT + modPath);

  const wrapped = lambdaWrapper.wrap(mod, {
    handler,
  });
  return wrapped;
};
