'use strict';

const fs = require('fs-extra');
const jestConfig = require('jest-config');
const path = require('path');
const Serverless = require('serverless');
const testUtils = require('./test-utils');

jest.mock('serverless/lib/classes/CLI', () =>
  jest.fn().mockImplementation((serverless) => {
    const CLI = jest.requireActual('serverless/lib/classes/CLI');
    return new CLI(serverless, ['invoke', 'test']);
  }),
);

describe('jest configuration', () => {
  beforeAll(() => {
    process.env.PLUGIN_TEST_DIR = path.join(__dirname);
  });

  beforeEach(() => {
    jest.spyOn(jestConfig, 'readConfigs');

    const tmp = testUtils.getTmpDirPath();
    fs.ensureDirSync(tmp);
    process.chdir(tmp);
    fs.ensureDirSync('__tests__');

    fs.writeFileSync(
      'package.json',
      `{
        "name": "application-name-4",
        "version": "0.0.1",
        "dependencies": {
          "serverless-jest-plugin": "file:${process.env.PLUGIN_TEST_DIR}"
        },
        "devDependencies": {
          "serverless": "^1.32.0"
        }
      }`,
    );

    fs.writeFileSync(
      'handler.js',
      `'use strict';

      module.exports.hello = (event, context, callback) => {
        const response = {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Go Serverless v1.0! Your function executed successfully!',
            input: event,
          }),
        };
      
        callback(null, response);
      
        // Use this code if you don't use the http event with the LAMBDA-PROXY integration
        // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
      };`,
    );

    fs.writeFileSync(
      '__tests__/hello.test.js',
      `
      const jestPlugin = require('${process.env.PLUGIN_TEST_DIR}/..');
      const wrapped = jestPlugin.getWrapper('handler', '/handler.js', 'hello');

      describe('hello', () => {
        it('runs the test', async () => {
          const result = await wrapped.run({});
          expect(result).toBeDefined();
        });
      });
      `,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // remove temp dir
    fs.removeSync(process.cwd());
  });

  afterAll(() => {
    process.chdir(process.env.PLUGIN_TEST_DIR);
    jest.unmock('serverless/lib/classes/CLI');
  });

  it('passes the serverless jest config through to jest', () => {
    fs.writeFileSync(
      'serverless.yml',
      `
      service: my-service
      provider:
        name: aws
        runtime: nodejs8.10
      plugins:
        - serverless-jest-plugin
      custom:
        jest:
          verbose: false
          collectCoverage: true
          useStderr: true
      functions:
        hello:
          handler: handler.hello
      `,
    );

    expect(fs.existsSync('coverage')).toBeFalsy();

    const serverless = new Serverless({ interactive: false });

    expect.assertions(8);

    return serverless
      .init()
      .then(() => {
        expect(serverless).toHaveProperty('service.custom.jest.verbose', false);
        expect(serverless).toHaveProperty('service.custom.jest.collectCoverage', true);
        expect(serverless).toHaveProperty('service.custom.jest.useStderr', true);
        return serverless.run();
      })
      .catch(e => expect(e).toBeUndefined())
      .then(() => {
        expect(jestConfig.readConfigs).toHaveBeenCalled();

        const [[globalConfig]] = jestConfig.readConfigs.mock.calls;

        expect(globalConfig).toBeDefined();
        expect(globalConfig).toMatchObject({
          verbose: false,
          collectCoverage: true,
          useStderr: true,
        });
        expect(fs.existsSync('coverage')).toBeTruthy();
      });
  }, 10000);

  it('modifies the serverless jest config and verifies the changes', () => {
    fs.writeFileSync(
      'serverless.yml',
      `
      service: my-service
      provider:
        name: aws
        runtime: nodejs8.10
      plugins:
        - serverless-jest-plugin
      custom:
        jest:
          verbose: true
          collectCoverage: false
          useStderr: true
      functions:
        hello:
          handler: handler.hello
      `,
    );

    expect(fs.existsSync('coverage')).toBeFalsy();

    const serverless = new Serverless({ interactive: false });

    expect.assertions(8);

    return serverless
      .init()
      .then(() => {
        expect(serverless).toHaveProperty('service.custom.jest.verbose', true);
        expect(serverless).toHaveProperty('service.custom.jest.collectCoverage', false);
        expect(serverless).toHaveProperty('service.custom.jest.useStderr', true);

        return serverless.run();
      })
      .catch(err => expect(err).toBeUndefined())
      .then(() => {
        expect(jestConfig.readConfigs).toHaveBeenCalled();

        const [[globalConfig]] = jestConfig.readConfigs.mock.calls;

        expect(globalConfig).toBeDefined();
        expect(globalConfig).toMatchObject({
          verbose: true,
          collectCoverage: false,
          useStderr: true,
        });
        expect(fs.existsSync('coverage')).toBeFalsy();
      });
  }, 10000);
});
