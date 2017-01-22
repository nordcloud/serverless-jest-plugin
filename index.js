'use strict';

const BbPromise = require('bluebird');

const createFunction = require('./create-function');
const createTest = require('./create-test');

class ServerlessJestPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.commands = {
      create: {
        commands: {
          test: {
            usage: 'Create mocha tests for service / function',
            lifecycleEvents: [
              'test',
            ],
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
            lifecycleEvents: [
              'create',
            ],
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
        usage: 'Invoke mocha tests for service / function',
        commands: {
          test: {
            usage: 'Invoke test(s)',
            lifecycleEvents: [
              'test',
            ],
            options: {
              function: {
                usage: 'Name of the function',
                shortcut: 'f',
              },
              reporter: {
                usage: 'Mocha reporter to use',
                shortcut: 'R',
              },
              'reporter-options': {
                usage: 'Options for mocha reporter',
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
      'create:test:test': () => {
        BbPromise.bind(this)
          .then(() => createTest(this.serverless, this.options));
      },
      'invoke:test:test': () => {
        BbPromise.bind(this)
          .then(this.runTests);
      },
      'create:function:create': () => {
        BbPromise.bind(this)
          .then(() => createFunction(this.serverless, this.options))
          .then(() => createTest(this.serverless, this.options));
      },
    };
  }

  runTests() {
    console.log('run tests');
  }
}

module.exports = ServerlessJestPlugin;