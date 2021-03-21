const assert = require("chai").assert;
const performRequest = require("../index.js").performRequest;
const sinon = require("sinon");
require("dotenv").config();
const Rekognition = require("node-rekognition");

const createRekognitionStub = () =>
  sinon.createStubInstance(Rekognition, {
    detectModerationLabels: sinon.stub().returns({
      ModerationLabels: [
        {
          Confidence: 99.92990112304688,
          Name: "Middle Finger",
          ParentName: "Rude Gestures"
        },
        {
          Confidence: 99.92990112304688,
          Name: "Rude Gestures",
          ParentName: ""
        }
      ],
      ModerationModelVersion: "4.0"
    })
  });

const createPinataStub = () => ({
  pinJSONToIPFS: sinon.stub().returns({
    IpfsHash: "QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u"
  })
});

describe("performRequest", () => {
  const jobID = "1";

  context("successful calls", () => {
    const requests = [
      {
        name: "standard",
        testData: {
          id: jobID,
          data: { hash: "QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u" }
        }
      }
    ];

    requests.forEach(req => {
      it(`${req.name}`, done => {
        var pinata = createPinataStub();

        var rekognitionStub = createRekognitionStub();

        performRequest({
          input: req.testData,
          callback: (statusCode, data) => {
            assert.equal(statusCode, 200);
            assert.equal(data.jobRunID, jobID);
            assert.isNotEmpty(data.data);
            done();
          },
          pinata: pinata,
          rekognition: rekognitionStub
        });
      });
    });
  });

  context("error calls", () => {
    const requests = [
      { name: "empty body", testData: {} },
      { name: "empty data", testData: { data: {} } }
    ];

    requests.forEach(req => {
      it(`${req.name}`, done => {
        performRequest({
          input: req.testData,
          callback: (statusCode, data) => {
            assert.equal(statusCode, 500);
            assert.equal(data.jobRunID, jobID);
            assert.equal(data.status, "errored");
            assert.isNotEmpty(data.error);
            done();
          }
        });
      });
    });
  });
});
