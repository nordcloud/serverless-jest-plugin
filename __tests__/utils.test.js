'use strict';

const path = require('path');
const fs = require('fs-extra');
const utils = require('../lib/utils.js');
const testUtils = require('../__tests__/test-utils');

describe('utils', () => {
  beforeAll(() => {
    process.env.PLUGIN_TEST_DIR = path.join(__dirname);
    const tmp = testUtils.getTmpDirPath();
    fs.mkdirsSync(tmp);
    process.chdir(tmp);
  });

  afterAll(() => {
    // remove temp dir
    fs.removeSync(process.cwd());
  });

  it('tests getTestFilePath for handler', () => {
    const testFilePath = utils.getTestFilePath('handler');
    expect(testFilePath).toBe('test/handler.js');
  });

  it('tests getTestFilePath for folder/handler', () => {
    const testFilePath = utils.getTestFilePath('folder/handler');
    expect(testFilePath).toBe('test/handler.js');
  });

  it('tests getTestFilePath for handler in custom folder', () => {
    const testFilePath = utils.getTestFilePath('handler', 'custom');
    expect(testFilePath).toBe('custom/handler.js');
  });

  it('tests getTestFilePath for folder/handler in custom folder', () => {
    const testFilePath = utils.getTestFilePath('folder/handler', 'custom');
    expect(testFilePath).toBe('custom/handler.js');
  });

  it('gets template from a file', () => {
    const templatePath =
      path.join(process.env.PLUGIN_TEST_DIR, '../', 'lib', 'templates', 'test-template.ejs');
    const expectedTemplate = fs.readFileSync(templatePath, 'utf-8');
    const template = utils.getTemplateFromFile(templatePath);
    expect(template).toBe(expectedTemplate);
  });

  it('tests default createTestFolder', () =>
    utils.createTestFolder().then((folder) => {
      expect(folder).toBe('test');
    }));

  it('tests default createTestFolder (exists)', () =>
    utils.createTestFolder().then((folder) => {
      expect(folder).toBe('test');
    }));

  it('tests custom createTestFolder', () =>
    utils.createTestFolder('custom').then((folder) => {
      expect(folder).toBe('custom');
    }));

  it('tests funcNameFromPath', () => {
    const functionName = utils.funcNameFromPath('path/to/functionName.js');
    expect(functionName).toBe('functionName');
  });

  it('tests setEnv with testFunction1 (env vars)', () => {
    const serverless = {
      service: {
        provider: {
        },
        functions: {
          testFunction1: {
          },
        },
      },
    };
    utils.setEnv(serverless, 'testFunction1');
    expect(process.env.TEST_VALUE_PROVIDER).toBe(undefined);
    expect(process.env.TEST_VALUE_FUNCTION).toBe(undefined);
  });

  it('tests setEnv with testFunction1', () => {
    const serverless = {
      service: {
        provider: {
          environment: {
            TEST_VALUE_PROVIDER: 'test value provider',
          },
        },
        functions: {
          testFunction1: {
            environment: {
              TEST_VALUE_FUNCTION: 'test value function 1',
            },
          },
        },
      },
    };
    utils.setEnv(serverless, 'testFunction1');
    expect(process.env.TEST_VALUE_PROVIDER).toBe('test value provider');
    expect(process.env.TEST_VALUE_FUNCTION).toBe('test value function 1');
  });

  it('tests setEnv with testFunction2', () => {
    const serverless = {
      service: {
        provider: {
          environment: {
            TEST_VALUE_PROVIDER: 'test value provider',
          },
        },
        functions: {
          testFunction2: {
            environment: {
              TEST_VALUE_FUNCTION: 'test value function 2',
            },
          },
        },
      },
    };
    utils.setEnv(serverless, 'testFunction2');
    expect(process.env.TEST_VALUE_PROVIDER).toBe('test value provider');
    expect(process.env.TEST_VALUE_FUNCTION).toBe('test value function 2');
  });
});
