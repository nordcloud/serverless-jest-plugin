'use strict';

const BbPromise = require('bluebird');
const path = require('path');
const fse = require('fs-extra');
const yamlEdit = require('yaml-edit');
const ejs = require('ejs');

const functionTemplateFile = path.join('templates', 'function-template.ejs');

const validFunctionRuntimes = [
  'aws-nodejs4.3',
  'aws-nodejs6.10',
];

const humanReadableFunctionRuntimes = `${validFunctionRuntimes
  .map(template => `"${template}"`).join(', ')}`;

const createAWSNodeJSFuncFile = (serverless, handlerPath) => {
  const handlerInfo = path.parse(handlerPath);
  const handlerDir = path.join(serverless.config.servicePath, handlerInfo.dir);
  const handlerFile = `${handlerInfo.name}.js`;
  const handlerFunction = handlerInfo.ext.replace(/^\./, '');
  let templateFile = path.join(__dirname, functionTemplateFile);

  if (serverless.service.custom &&
    serverless.service.custom['serverless-jest-plugin'] &&
    serverless.service.custom['serverless-jest-plugin'].functionTemplate) {
    templateFile = path.join(serverless.config.servicePath,
      serverless.service.custom['serverless-jest-plugin'].functionTemplate);
  }

  const templateText = fse.readFileSync(templateFile).toString();
  const jsFile = ejs.render(templateText, {
    handlerFunction,
  });

  const filePath = path.join(handlerDir, handlerFile);

  serverless.utils.writeFileDir(filePath);
  if (serverless.utils.fileExistsSync(filePath)) {
    const errorMessage = [
      `File "${filePath}" already exists. Cannot create function.`,
    ].join('');
    throw new serverless.classes.Error(errorMessage);
  }
  fse.writeFileSync(path.join(handlerDir, handlerFile), jsFile);

  const functionDir =
    handlerDir
      .replace(`${process.cwd()}/`, '');

  serverless.cli.log(`Created function file ${path.join(functionDir, handlerFile)}`);
  return BbPromise.resolve();
};

const createFunction = (serverless, options) => {
  serverless.cli.log('Generating function...');
  const functionName = options.function;
  const handler = options.handler;

  const serverlessYmlFilePath = path
    .join(serverless.config.servicePath, 'serverless.yml');

  const serverlessYmlFileContent = fse
    .readFileSync(serverlessYmlFilePath).toString();

  return serverless.yamlParser.parse(serverlessYmlFilePath)
    .then((config) => {
      const runtime = [config.provider.name, config.provider.runtime].join('-');

      if (validFunctionRuntimes.indexOf(runtime) < 0) {
        const errorMessage = [
          `Provider / Runtime "${runtime}" is not supported.`,
          ` Supported runtimes are: ${humanReadableFunctionRuntimes}.`,
        ].join('');
        throw new serverless.classes.Error(errorMessage);
      }

      const ymlEditor = yamlEdit(serverlessYmlFileContent);

      if (ymlEditor.hasKey(`functions.${functionName}`)) {
        const errorMessage = [
          `Function "${functionName}" already exists. Cannot create function.`,
        ].join('');
        throw new serverless.classes.Error(errorMessage);
      }

      const funcDoc = Object.assign({}, { [functionName]: { handler } });
      Object.assign(serverless.service.functions, funcDoc);

      if (ymlEditor.insertChild('functions', funcDoc)) {
        const errorMessage = [
          `Could not find functions in ${serverlessYmlFilePath}`,
        ].join('');
        throw new serverless.classes.Error(errorMessage);
      }

      fse.writeFileSync(serverlessYmlFilePath, ymlEditor.dump());

      if (validFunctionRuntimes.indexOf(runtime) > -1) {
        return createAWSNodeJSFuncFile(serverless, handler);
      }

      return BbPromise.resolve();
    });
};

module.exports = createFunction;
