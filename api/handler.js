'use strict';

import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import axios from 'axios';

// Initialize the SQS client
const sqsClient = new SQSClient({ region: 'us-east-1' });

export const dequeue = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const location = JSON.parse(event.Records[0].body);
    console.log(location.city);

    if (location.city && location.city.length) {
      
      const response = await axios.get(
        `http://api.openweathermap.org/data/2.5/weather?q=${location.city}&units=metric&APPID=08e3ad0437282f0abefa56ee74ab56af`
      );

      const answer = `Temperature - ${response.data.main.temp}°C. Humidity - ${response.data.main.humidity}%. ${response.data.weather[0].description} is expected`;
      console.log(answer);
      
      //console.log(`It is always sunny in ${location.city}`);
      callback(null, {
        statusCode: 200,
        body: JSON.stringify('success'),
      });
    } else {
      throw new Error('Undefined inputs...');
    }
  // I took these lines out because the processing of the lambda fxn needed to fail explitly for me to see messages in the DLQ
  // } catch (error) {
  //   console.error('Error processing SQS message:', error);
  //   callback(null, {
  //     statusCode: 500,
  //     body: JSON.stringify('Error processing SQS message'),
  //   });
  // }
  }catch (error) {
    console.error('Error processing SQS message:', error);
    throw new Error('Failed to process message'); // Explicit failure
  }
  
};

export const enqueue = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    console.log(event.queryStringParameters);

    if (event.queryStringParameters) {
      const params = {
        MessageBody: JSON.stringify(event.queryStringParameters),
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/058264198774/WeatherRequests',
      };

      const command = new SendMessageCommand(params);
      const result = await sqsClient.send(command);

      callback(null, {
        statusCode: 200,
        body: JSON.stringify(result),
      });
    }
  } catch (error) {
    console.error('Error sending SQS message:', error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify('Request failed'),
    });
  }
};







/* 
'use strict';
const SQS = require('aws-sdk/clients/sqs');
const axios = require('axios');
const sqs = new SQS();

module.exports.dequeue = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
    const location = JSON.parse(event.Records[0].body);
    console.log(location.city);
    if (location.city && location.city.length) {
      const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${location.city}&units=metric&APPID=08e3ad0437282f0abefa56ee74ab56af`)
      const answer = `Temperature - ${response.data.main.temp}°C. Humidity - ${response.data.main.humidity}%. ${response.data.weather[0].description} is expected`
      console.log(answer);
      callback(null, {
        statusCode: 200,
        body: JSON.stringify("success")
      });
    } else {
      throw new Error("Undefined inputs...")
    } 
};

module.exports.enqueue = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    console.log(event.queryStringParameters);
    if (event.queryStringParameters) {
      const params = {
        MessageBody: JSON.stringify(event.queryStringParameters),
        QueueUrl: "https://sqs.us-east-1.amazonaws.com/885121665536/WeatherRequestQueue"
      }
      const result = await sqs.sendMessage(params).promise();
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(result),
      })
    }
  } catch (e) {
    console.log(e);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify("Request failed"),
    })
  }
};
 */
