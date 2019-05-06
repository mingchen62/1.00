// https://medium.com/@Keithweaver_/using-aws-dynamodb-using-node-js-fd17cf1724e0
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
});

var docClient = new AWS.DynamoDB.DocumentClient();

console.log("Querying for status 1519517100-1519557901 .");

var id= "15275 Elfrieda Street XYZ AB:2";
var ts = "1519557901";

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

var params = {
   TableName: "events_"+ getWeekYear(ts),
   KeyConditionExpression: "meterId = :id AND #DocTimestamp <= :end",
   ExpressionAttributeNames: {
     '#DocTimestamp': 'timestamp'
   },
   ExpressionAttributeValues: {
     ":id": id, 
     ":end": ts
}
};
var isOccupied="unknown";
var lastUpdatedTS="unknown";


docClient.query(params, function(err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {

        console.log("Query succeeded.");
        var o = {} ;
        o['meterId']= id;

        data.Items.forEach(function(item) {
            console.log(" -", item.meterId + " "+item.timestamp+ " " + item.isOccupied);
        });
       
        if ( data.Items.length >= 1 ) {

			lastUpdatedTS=data.Items[data.Items.length-1].timestamp;
            isOccupied=data.Items[data.Items.length-1].isOccupied;
            o['location']=data.Items[data.Items.length-1].location
            o['address']=data.Items[data.Items.length-1].address
        }

       o['lastUpdatedTS']=lastUpdatedTS;
       o['isOccupied']=isOccupied
       console.log("Last update time "+ lastUpdatedTS);
       console.log("Last known status "+ isOccupied);
       console.log(JSON.stringify(o));
    }
});

