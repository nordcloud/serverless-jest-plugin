'use strict';

const Serverless = require('serverless');
const execSync = require('child_process').execSync;
const path = require('path');
const fs = require('fs-extra');
const {
  getTmpDirPath,
  replaceTextInFile,
  spawnPromise,
} = require('./test-utils');

const serverless = new Serverless();
serverless.init();
const serverlessExec = path.join(serverless.config.serverlessPath, '..', 'bin', 'serverless');

describe('integration', () => {
  beforeAll(() => {
    process.env.PLUGIN_TEST_DIR = path.join(__dirname);
    const tmpDir = getTmpDirPath();
    fs.mkdirsSync(tmpDir);
    fs.copySync(path.join(process.env.PLUGIN_TEST_DIR, 'test-service-options'), tmpDir);
    fs.copySync(path.join(process.env.PLUGIN_TEST_DIR, '..'), path.join(tmpDir, '.local'));
    const packageJsonPath = path.join(tmpDir, 'package.json');
    const packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.name = `application-${Date.now()}`;
    packageJson.dependencies['serverless-jest-plugin'] = `file:${tmpDir}/.local`;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
    process.chdir(tmpDir);
  });

  afterAll(() => {
    // remove temp dir
    fs.removeSync(process.cwd());
  });

  it('should contain test params in cli info', () => {
    const test = execSync(serverlessExec);
    const result = new Buffer(test, 'base64').toString();
    expect(result).toContain('create test');
    expect(result).toContain('Create jest tests for service / function');
    expect(result).toContain('create function');
    expect(result).toContain('Create a function into the service');
    expect(result).toContain('invoke test');
    expect(result).toContain('Invoke test(s)');
    expect(result).toContain('ServerlessJestPlugin');
  });

  it('should create test for hello function', () => {
    const test = execSync(`${serverlessExec} create test --function hello --stage prod`);
    const result = new Buffer(test, 'base64').toString();
    expect(result).toContain('Created test file __tests__/hello.test.js');
  });

  it('should create function goodbye', () => {
    const test = execSync(`${serverlessExec} create function --function goodbye --handler goodbye/index.handler --stage prod`);
    const result = new Buffer(test, 'base64').toString();
    expect(result).toContain('Created function file goodbye/index.js');
  });


  it('should run tests successfully', () => {
    // change test files to use local proxy version of jest plugin
    replaceTextInFile(
      path.join('__tests__', 'hello.test.js'),
      'require(\'serverless-jest-plugin\')',
      'require(\'../.serverless_plugins/serverless-jest-plugin/index.js\')');
    replaceTextInFile(
      path.join('__tests__', 'goodbye.test.js'),
      'require(\'serverless-jest-plugin\')',
      'require(\'../.serverless_plugins/serverless-jest-plugin/index.js\')');

    return spawnPromise(serverlessExec, 'invoke test --stage prod')
      .then(({ stderr }) => {
        expect(stderr).toContain('PASS');
        return expect(stderr).toContain('Test Suites: 2 passed, 2 total');
      });
  }, 120000);
});
