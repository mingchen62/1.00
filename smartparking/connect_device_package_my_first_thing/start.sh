# stop script on error
set -e

# Check to see if root CA file exists, download if not
if [ ! -f ./root-CA.crt ]; then
  printf "\nDownloading AWS IoT Root CA certificate from AWS...\n"
  curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > root-CA.crt
fi

# install AWS Device SDK for NodeJS if not already installed
if [ ! -d ./node_modules ]; then
  printf "\nInstalling AWS SDK...\n"
  npm install aws-iot-device-sdk
fi

# run pub/sub sample app using certificates downloaded in package
printf "\nRunning pub/sub sample application...\n"
node node_modules/aws-iot-device-sdk/examples/device-example.js --host-name=a24ce52qwvwm76-ats.iot.us-east-1.amazonaws.com --private-key=MyFirstThing.private.key --client-certificate=MyFirstThing.cert.pem --ca-certificate=root-CA.crt --client-id=sdk-nodejs-5e5cea93-72e9-44ce-89ae-67d8250c2cc2