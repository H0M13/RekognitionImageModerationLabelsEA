# IPFS + Amazon Rekognition Image Moderation External Adapter

This external adapter downloads image bytes from [IPFS](https://ipfs.io/) given the content hash and requests image moderation labels from the [Amazon Rekognition](https://aws.amazon.com/rekognition/) cloud-based computer vision platform. The moderation labels are pinned to IPFS and a bytes32 hex string is returned from which the base58 encoded IPFS content hash [can be reconstructed](https://ethereum.stackexchange.com/questions/17094/how-to-store-ipfs-hash-using-bytes32). Currently [bytes32 is the maximum response size](https://docs.chain.link/docs/make-a-http-get-request#response-types) for the result of a Chainlink job.

## Environment variables

You will need an AWS account to be able to make requests to Amazon Rekognition. See [Amazon's documentation](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/) for help on setting up an account.

| Variable                |              | Description                          |            Example             |
| ----------------------- | :----------: | ------------------------------------ | :----------------------------: |
| `AWS_ACCESS_KEY_ID`     | **Required** | The ID of your AWS access key        |        `ABCDEFGABCDEFG`        |
| `AWS_SECRET_ACCESS_KEY` | **Required** | Your AWS secret access key           | `AbCdEfGaBcDeFgAbCdEfGaBcDeFg` |
| `AWS_REGION`            | **Required** | The AWS region you would like to use |          `eu-west-2`           |

## Example request

### Input

- `hash`: The image's IPFS content hash

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "ModerationLabels": [
      {
        "Confidence": 99.92990112304688,
        "Name": "Middle Finger",
        "ParentName": "Rude Gestures"
      },
      {
        "Confidence": 99.92990112304688,
        "Name": "Rude Gestures",
        "ParentName": ""
      }
    ],
    "ModerationModelVersion": "4.0",
    "result": "0xafacbc7a25ed1d9a9c4af37bc972fb2b599f5cc6496fe84ffd5417ff34e3bb62"
  },
  "result": "0xafacbc7a25ed1d9a9c4af37bc972fb2b599f5cc6496fe84ffd5417ff34e3bb62"
}
```

## Install Locally

Install dependencies:

```bash
npm i
```

### Test

Run the local tests:

```bash
npm run test
```

Natively run the application (defaults to port 8080):

### Run

```bash
npm start
```

## Call the external adapter/API server

```bash
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "hash": "QmdT7hKV1EfuaXSAYa65KUZWJnxF96yRPZNS9WeG8gUsR2" } }'
```

## Docker

If you wish to use Docker to run the adapter, you can build the image by running the following command:

```bash
docker build . -t external-adapter
```

Then run it with:

```bash
docker run -p 8080:8080 -it external-adapter:latest
```

## Serverless hosts

After [installing locally](#install-locally):

### Create the zip

```bash
zip -r external-adapter.zip .
```

### Install to AWS Lambda

- In Lambda Functions, create function
- On the Create function page:
  - Give the function a name
  - Use Node.js 12.x for the runtime
  - Choose an existing role or create a new one
  - Click Create Function
- Under Function code, select "Upload a .zip file" from the Code entry type drop-down
- Click Upload and select the `external-adapter.zip` file
- Handler:
  - index.handler for REST API Gateways
  - index.handlerv2 for HTTP API Gateways
- Add the environment variable (repeat for all environment variables):
  - Key: API_KEY
  - Value: Your_API_key
- Save

#### To Set Up an API Gateway (HTTP API)

If using a HTTP API Gateway, Lambda's built-in Test will fail, but you will be able to externally call the function successfully.

- Click Add Trigger
- Select API Gateway in Trigger configuration
- Under API, click Create an API
- Choose HTTP API
- Select the security for the API
- Click Add

#### To Set Up an API Gateway (REST API)

If using a REST API Gateway, you will need to disable the Lambda proxy integration for Lambda-based adapter to function.

- Click Add Trigger
- Select API Gateway in Trigger configuration
- Under API, click Create an API
- Choose REST API
- Select the security for the API
- Click Add
- Click the API Gateway trigger
- Click the name of the trigger (this is a link, a new window opens)
- Click Integration Request
- Uncheck Use Lamba Proxy integration
- Click OK on the two dialogs
- Return to your function
- Remove the API Gateway and Save
- Click Add Trigger and use the same API Gateway
- Select the deployment stage and security
- Click Add

### Install to GCP

- In Functions, create a new function, choose to ZIP upload
- Click Browse and select the `external-adapter.zip` file
- Select a Storage Bucket to keep the zip in
- Function to execute: gcpservice
- Click More, Add variable (repeat for all environment variables)
  - NAME: API_KEY
  - VALUE: Your_API_key
