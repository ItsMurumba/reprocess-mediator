import mongoose from 'mongoose'
import { sendDataToKafka } from './kafka.mjs';
import { KAFKA_2XX_TOPIC, MONGODB_CONNECTION_STRING, MONGODB_DIRECT_CONNECTION } from '../config/config.mjs';
import logger from '../logger.mjs';


async function connectToMongoDB(attempt = 1, errorMessage = "") {
  if (attempt > 3) {
    throw new Error(errorMessage);
  }
  try {
    const db = await mongoose.connect(MONGODB_CONNECTION_STRING, {
      directConnection: MONGODB_DIRECT_CONNECTION,
      connectTimeoutMS: 15_000 * attempt,
    });

    if (db.connection.readyState === 1) {
      logger.info("Successfully Connected to MongoDB");
      return;
    }
  } catch (error) {
    logger.error(`Failed to connect to MongoDB instance attempt: ${attempt}`);
    return connectToMongoDB(attempt + 1, error.message);
  }
}

export async function queryOpenhimTransactions({toDate, fromDate, method, resources}){
  await connectToMongoDB();

  const query = await mongoose.connection.db.collection('transactions')
    .aggregate([], { allowDiskUse: true })
    .match({
      status: 'Successful',
      'request.path': { $regex: /^\/fhir/ },
      ...(['POST', 'DELETE'].includes(method) ? { 'request.method': method.toUpperCase() } : null),
      'request.timestamp': {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      }
    })
    .project({
      "_id": 0,
      "request": 1
    })
    .sort( { 'request.timestamp': 1 })
    .addCursorFlag('exhaust', true)
    .toArray();

  let payload
  if(method === 'POST'){
     logger.info("Processing POST requests");
     payload = await formatPostRequests(query, resources);

  }else {
    logger.info("Processing DELETE requests");
    payload = await formateDeleteRequests(query);
  }

  //There is an issue working with the cursor in the aggregation pipeline, need to use cursor instead of toArray (but it is something we can come back to later)
  //await query.close();
  await mongoose.disconnect();

  return payload;
  
}

export function formatPostRequests(query, resources) {
  const requestBodies = [];
  let numberOfFhirResources = 0;
  let numberOfTransactions = 0;

  for (let openHimTransaction of query) {
    let requestBody;
    requestBody = JSON.parse(openHimTransaction.request.body);
    logger.info(`Number of entries ${requestBody.entry.length}`);

    const entry = requestBody.entry.filter(e => resources.includes(e.resource.resourceType));

    numberOfFhirResources += entry.length;
    requestBody.entry = entry;

    requestBodies.push(requestBody);

    numberOfTransactions++;
  }

  return {
    numberOfFhirResources,
    numberOfTransactions,
    requestBodies,
  };
}

export function formateDeleteRequests(payload) {
  const requests = [];
  let numberOfTransactions = 0;

  for (let openHimTransaction of payload) {
    numberOfTransactions++;
    // removing the prefix from the url path
    const url = openHimTransaction.request.path.split('/fhir/')[1];
    payload = { request: { method: "DELETE", url } };
    requests.push(payload);
  }

  return {
    numberOfTransactions,
    requests,
  };
}
//get collections of messages and convert them to strings

export async function pushMessagesToKafka(payloads){
  let failedCounter = 0;

  for (let payload of payloads){
    try {
      await new Promise((resolve, reject) => {
        sendDataToKafka(
          payload,
          reject,
          resolve,
          KAFKA_2XX_TOPIC)
      });
    } catch (error) {
      logger.error(`Failed to push to Kafka. Error Message: ${error.message}`);
      failedCounter++;
    }
    
  }

  return failedCounter;
}


export async function reprocessFHIRTransactions({ transactionRequestMethod = 'ALL', sortedOrderOfTransaction = "Timestamped", reprocessFromDate, reprocessToDate }) {
  await connectToMongoDB();

  const method = transactionRequestMethod.toLocaleUpperCase();

  const query = mongoose.connection.db.collection('transactions')
    .aggregate([], { allowDiskUse: true })
    .match({
      status: 'Successful',
      'request.path': { $regex: /^\/fhir/ },
      ...(['POST', 'DELETE'].includes(method) ? { 'request.method': method.toUpperCase() } : null),
      'request.timestamp': {
        $gte: reprocessFromDate.toDate(),
        $lte: reprocessToDate.toDate(),
      }
    })
    .project({
      "_id": 0,
      "request": 1
    })
    .sort({ ...(sortedOrderOfTransaction === 'Segregated Request and Timestamped' ? { 'request.method': -1, 'request.timestamp': 1 } : { 'request.timestamp': 1 }) })
    .addCursorFlag('exhaust', true);

  // count() method on Mongodb's FindCursor class is deprecated and will require querying the database again so I figure this is faster.
  let successfulCounter = 0;
  let failedCounter = 0;
  let failedRanges = null;

  for await (const openHimTransaction of query) {
    let payload;

    if (openHimTransaction.request.method === "POST") {
      payload = JSON.parse(openHimTransaction.request.body);
    } else {
      // removing the prefix from the url path
      const url = openHimTransaction.request.path.split('/fhir/')[1];
      payload = { request: { method: "DELETE", url } };
    }

    try {
      await new Promise((resolve, reject) => {
        sendDataToKafka(
          payload,
          reject,
          resolve,
          KAFKA_2XX_TOPIC)
      });
      successfulCounter++;
    } catch (error) {
      logger.error(`Failed to push to Kafka. Error Message: ${error.message}`);

      if (failedRanges === null) {
        failedRanges = {
          from: openHimTransaction.request.timestamp,
          to: openHimTransaction.request.timestamp,
        }
      } else if (isFutureDate(openHimTransaction.request.timestamp, failedRanges.to)) {
        failedRanges.to = openHimTransaction.request.timestamp;
      } else {
        failedRanges.from = openHimTransaction.request.timestamp;
      }

      failedCounter++;
    }
  }

  await query.close();
  await mongoose.disconnect();

  return {
    failedCounter,
    successfulCounter,
    failedRanges
  };
}

function isFutureDate(newFailedTransactionDate, currentFromDate) {
  const newDate = new Date(newFailedTransactionDate);
  const existingDate = new Date(currentFromDate);

  if (newDate > existingDate) {
    return true;
  }

  return false
}
