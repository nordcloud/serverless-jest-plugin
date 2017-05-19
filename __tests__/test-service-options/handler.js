'use strict';

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      stage: process.env.STAGE,
      input: event,
    }),
  };

  if (process.env.STAGE !== 'prod-stage-test' || process.env.HELLO !== 'world us-east-1') {
    // trigger error with output
    callback('Environmental variables failed');
    throw new Error('Environmental variables failed');
  }

  return callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
