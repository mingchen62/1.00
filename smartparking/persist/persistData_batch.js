var AWS = require("aws-sdk");
var fs = require('fs');
AWS.config.update({
    region: "us-east-1",
});

var docClient = new AWS.DynamoDB.DocumentClient();
console.log("Importing Spots into DynamoDB. Please wait.");
var events= JSON.parse(fs.readFileSync('events.json', 'utf8'));


getWeekYear = function(timestamp) {
  var date = new Date(timestamp*1000);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  var year = date.getFullYear();
  var week1 = new Date(date.getFullYear(), 0, 4);
  var week = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
  return year +"_"+week
}

events.forEach(function(event) {
  console.log(event)

  var params = {
        TableName: "events_"+ getWeekYear(event.timestamp),
        Item: {
            "meterId": event.meter.address+":"+event.meter.number,
            "timestamp": ''+event.timestamp,
            "isOccupied": event.isOccupied,
            "number": event.meter.number,
            "location": event.meter.location,
            "address": event.meter.address
        }
    };

  docClient.put(params, function(err, data) {
       if (err) {
           console.error("Unable to add event", event.meterId, ". Error JSON:", JSON.stringify(err, null, 2));
       } else {
           console.log("PutItem succeeded:", event.meterId);
       }
    });
});
