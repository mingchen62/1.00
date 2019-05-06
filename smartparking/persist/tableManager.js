// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var week= require('./week.js');
// Set the region 
AWS.config.update({region: 'us-east-1'});

// Create the DynamoDB service object
ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});

weekly_table= getWeekYear(new Date());
//table schema
var params = {
  AttributeDefinitions: [
    {
      AttributeName: 'meterId',
      AttributeType: 'N'
    },
    {
      AttributeName: 'timestamp',
      AttributeType: 'N'
    }
  ],
  KeySchema: [
    {
      AttributeName: 'meterId',
      KeyType: 'HASH'
    },
    {
      AttributeName: 'timestamp',
      KeyType: 'RANGE'
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1
  },
  TableName: weekly_table,
  StreamSpecification: {
    StreamEnabled: false
  }
};

exports.checkTable = function checkTable(tableName, callback) {
    status=false;
    console.log("Check table: " + tableName);
    var params = {
        TableName: tableName /* required */
    };
    ddb.describeTable(params, function(err, data) {
        if (err) {
            status=false;
            console.log(err, err.stack); // an error occurred
        }
        else {
            status=true;
            console.log(data); // successful response
        }
        console.log("STATUS===========>"+status);
        callback(status);
    });
}


exports.checkTable (weekly_table, function(status) {
  if (status) {
    console.log("Succ: table found");
  } else {
    console.log("Table not found: creating table");

// Call DynamoDB to create the table
  ddb.createTable(params, function(err, data) {
    if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data);
  }
  });
  }
});
