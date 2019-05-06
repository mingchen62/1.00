var awsIot = require('aws-iot-device-sdk');
var fs = require('fs');
var events = JSON.parse(fs.readFileSync('./events.json', 'utf8'));
// Config
var device = awsIot.device({
   keyPath: "./MyFirstThing.private.key",
  certPath: "./MyFirstThing.cert.pem",
    caPath: "./root-CA.crt",
      host: "a24ce52qwvwm76-ats.iot.us-east-1.amazonaws.com"

});

var cnt=1;

// Connect
device
  .on('connect', function() {
    console.log('Connected');

// Subscribe to myTopic
    device.subscribe("myTopic");
  
// Publish to myTopic on an interval
    events.forEach( 
          function(obj) {
          device.publish('myTopic', JSON.stringify(obj));  
       });
  });

// Receiving a message from any topic that this device is
// subscribed to.
device
  .on('message', function(topic, payload) {
    console.log(' received message', topic, payload.toString());
  });

// Error
device
  .on('error', function(error) {
    console.log('Error: ', error);
  });
