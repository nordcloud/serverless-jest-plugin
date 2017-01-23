'use strict';

const Serverless = require('serverless');
const execSync = require('child_process').execSync;
const path = require('path');
const fse = require('fs-extra');
const testUtils = require('./test-utils');

const serverless = new Serverless();
serverless.init();
const serverlessExec = path.join(serverless.config.serverlessPath, '..', 'bin', 'serverless');

describe('integration', () => {
  beforeAll(() => {
    process.env.PLUGIN_TEST_DIR = path.join(__dirname);
    const tmpDir = testUtils.getTmpDirPath();
    fse.mkdirsSync(tmpDir);
    fse.copySync(path.join(process.env.PLUGIN_TEST_DIR, 'test-service'), tmpDir);
    fse.copySync(path.join(process.env.PLUGIN_TEST_DIR, '..'), path.join(tmpDir, '.local'));
    const packageJsonPath = path.join(tmpDir, 'package.json');
    const packageJson = fse.readJsonSync(packageJsonPath);
    packageJson.dependencies['serverless-jest-plugin'] = `file:${tmpDir}/.local`;
    fse.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
    process.chdir(tmpDir);
  });

  it('should contain test params in cli info', () => {
    const test = execSync(serverlessExec);
    const result = new Buffer(test, 'base64').toString();
    expect(result).toContain(
      'create test ................... Create jest tests for service / function',
    );
    expect(result).toContain(
      'create function ............... Create a function into the service',
    );
    expect(result).toContain(
      'invoke test ................... Invoke test(s)',
    );
  });

  it('should create test for hello function', () => {
    const test = execSync(`${serverlessExec} create test --function hello`);
    const result = new Buffer(test, 'base64').toString();
    expect(result).toContain(
      'serverless-jest-plugin: created hello.test.js',
    );
  });

  it('should create function goodbye', () => {
    const test = execSync(
      `${serverlessExec} create function --function goodbye --handler goodbye/index.handler`,
    );
    const result = new Buffer(test, 'base64').toString();
    expect(result).toContain(
      'serverless-jest-plugin: created goodbye/goodbye.test.js',
    );
  });


  // it('should run tests successfully', () => {
  //   // change test files to use local proxy version of mocha plugin
  //   testUtils.replaceTextInFile(
  //     path.join('hello.test.js'),
  //     'require(\'serverless-jest-plugin\')',
  //     'require(\'../.serverless_plugins/serverless-jest-plugin/index.js\')'
  //   );
  //   testUtils.replaceTextInFile(
  //     path.join('goodbye', 'goodbye.test.js'),
  //     'require(\'serverless-jest-plugin\')',
  //     'require(\'../.serverless_plugins/serverless-jest-plugin/index.js\')'
  //   );
  //   const test = execSync(`${serverlessExec} invoke test`);
  //   const result = new Buffer(test, 'base64').toString();
  //   expect(result).toContain(
  //     'goodbye\n    ✓ implement tests here'
  //   );
  //
  //   expect(result).toContain(
  //     'hello\n    ✓ implement tests here'
  //   );
  //
  //   expect(result).toContain(
  //     '2 passing'
  //   );
  // });
});
