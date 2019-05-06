"use strict";

var AWS = require('aws-sdk');
AWS.config.update({
  region: "us-east-1",
});

// Get Dynamo table name.  
// with the actual table name from your stack.
const helloDBArn = process.env['METER_DB'] || 'events_2018_8';  
const helloDBArnArr = helloDBArn.split('/');
const meterTableName = helloDBArnArr[helloDBArnArr.length - 1];

// handleHttpRequest is the entry point for Lambda requests
exports.handleHttpRequest = function(request, context, done) {
  try {
    let meterId = request.pathParameters.meterId;
    let response = {
      headers: {},
      body: '',
      statusCode: 200
    };

    switch (request.httpMethod) {
      case 'GET': {
        console.log('GET');
        console.log(" pathParameters.meterId "+meterId);
        let ts= request.queryStringParameters.ts;
        console.log(" pathParameters.querystring ts "+ts);
        let dynamo = new AWS.DynamoDB.DocumentClient();
        var params = {
          TableName: meterTableName,
          KeyConditionExpression: 'meterId = :id AND #DocTimestamp <= :end',
          ExpressionAttributeNames: {
          '#DocTimestamp': 'timestamp'
          },
          ExpressionAttributeValues: {
          ':id': meterId, 
          ':end': ts
          }
          };
        // Call DynamoDB to read the item from the table
        dynamo.query(params, function(err, data) {
          if (err) {
            console.log("Error", err);
            throw `Dynamo Get Error (${err})`
          } else {
            
            console.log("Query succeeded.");
            var o = {} ;
            o['meterId']= meterId;

            data.Items.forEach(function(item) {
              console.log(" -", item.meterId + " "+item.timestamp+ " " + item.isOccupied);
            });
            if ( data.Items.length >= 1 ) {

              o['lastUpdatedTS']=data.Items[data.Items.length-1].timestamp;
              o['isOccupied']=data.Items[data.Items.length-1].isOccupied;
              o['location']=data.Items[data.Items.length-1].location
              o['address']=data.Items[data.Items.length-1].address
            }

            response.body = JSON.stringify(o);

            done(null, response);
          }
        });
        break;
      }
      
    }
  } catch (e) {
    done(e, null);
  }
}
