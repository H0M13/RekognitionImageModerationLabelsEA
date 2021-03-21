const { Requester } = require("@chainlink/external-adapter");
const Rekognition = require("node-rekognition");
const pinataSDK = require("@pinata/sdk");
const https = require("https");
const Stream = require("stream").Transform;
const bs58 = require("bs58");

const createRequest = async (input, callback) => {
  const pinata = pinataSDK(
    process.env.PINATA_API_KEY,
    process.env.PINATA_SECRET_API_KEY
  );

  const AWSParameters = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  };

  const rekognition = new Rekognition(AWSParameters);

  return performRequest({
    input,
    callback,
    pinata,
    rekognition
  })
}

const performRequest = ({
  input,
  callback,
  pinata,
  rekognition
}) => {
  const { data, id: jobRunID } = input;

  if (!data) {
    callback(500, Requester.errored(jobRunID, "No data"));
    return;
  }

  const { hash } = data;

  if (jobRunID === undefined) {
    callback(500, Requester.errored(jobRunID, "Job run ID required"));
    return;
  }

  if (hash === undefined) {
    callback(500, Requester.errored(jobRunID, "Content hash required"));
  } else {
    const url = `https://gateway.ipfs.io/ipfs/${hash}`;

    console.log(url);
    try {
      https
        .request(url, function(response) {
          var imgBytesStream = new Stream();

          response.on("data", function(chunk) {
            imgBytesStream.push(chunk);
          });

          response.on("end", function() {
            requestModerationLabels(imgBytesStream.read());
          });
        })
        .end();

      const requestModerationLabels = async imgBytes => {
        try {
          const moderationLabels = await rekognition.detectModerationLabels(
            imgBytes
          );

          const response = {
            data: moderationLabels
          };

          const pinataResponse = await pinata.pinJSONToIPFS(response.data);

          const { IpfsHash } = pinataResponse;

          const asBytes32 = getBytes32FromIpfsHash(IpfsHash);

          response.data.result = asBytes32;

          callback(200, Requester.success(jobRunID, response));
        } catch (error) {
          console.error(error);
          callback(500, Requester.errored(jobRunID, error));
        }
      };
    } catch (error) {
      console.error(error);
      callback(500, Requester.errored(jobRunID, error));
    }
  }
}

const getBytes32FromIpfsHash = (ipfsListing) => {
  return "0x"+bs58.decode(ipfsListing).slice(2).toString('hex')
}

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data);
  });
};

// This is a wrapper to allow the function to work with
// AWS Lambda
exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data);
  });
};

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false
    });
  });
};

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest;
module.exports.performRequest = performRequest;
