'use strict'

import moment from 'moment'
import { Client } from 'es7'

import {
  FHIR_RAW_CAREPLAN,
  FHIR_RAW_ENCOUNTER,
  FHIR_RAW_MEDICATIONDISPENSE,
  FHIR_RAW_MEDICATIONSTATEMENT,
  FHIR_RAW_PATIENT,
  FHIR_RAW_PROCEDURE,
  FHIR_RAW_QUESTIONNAIRERESPONSE,
  FHIR_RAW_RELATEDPPERSON,
  FHIR_RAW_SERVICEREQUEST,
  FHIR_RAW_DIAGNOSTICREPORT,
  FHIR_RAW_OBSERVATION,
  ES_HIT_SIZE,
  ES_URL,
  ES_HOSTS,
  ES_USERNAME,
  ES_PASSWORD,
  KAFKA_CONCURRENCY,
  KAFKA_REPROCESSING_TOPIC,
  IS_LOGSTASH_DRIVER
} from '../config/config.mjs'
import { updateOpenhimTransaction } from '../openhim.mjs'
import { buildReturnObject, makeQuerablePromise } from './utils.mjs'
import { validateDateRanges } from './dateValidation.mjs'

import logger from '../logger.mjs'
import { sendDataToKafka } from './kafka.mjs'

const esHosts = ES_HOSTS.replace(/"/g, '')
  .split(',')
  .map((esHost) => 'http://' + esHost)

var client = new Client({
  node: esHosts,
  headers: {
    'Content-Type': 'application/json'
  },
  auth: {
    username: ES_USERNAME,
    password: ES_PASSWORD
  }
})

export default function reprocess(req, res) {
  const reprocessFhirResources = validateDateRanges(req.body.reprocess_fhir_resources);
  const transactionId = req.headers['x-openhim-transactionid'];

  let validatedParameters

  try {
    validatedParameters = validateReprocessParameters(
      reprocessFhirResources
    )
  } catch (error) {
    const returnObject = buildReturnObject(
      'Failed',
      400,
      { message: "Failed reprocessing", error: error.message, configBody: req.body }
    )
    res.set('Content-Type', 'application/json+openhim')
    res.status(400)
    return res.send(returnObject)
  }

  reprocessIndexes(validatedParameters)
    .then(() => {
      updateOpenhimTransaction(
        transactionId,
        'Successful',
        200,
        { message: "Successfully Reprocessed ES Indices", indices: validatedParameters.indices, from: validatedParameters.reprocessFromDate, to: validatedParameters.reprocessToDate }
      )
      logger.info(
        `Successfully Reprocessed ES Indices: [ ${validatedParameters.indices} ] | From: ${validatedParameters.reprocessFromDate} | To: ${validatedParameters.reprocessToDate}`
      )
    })
    .catch((error) => {
      updateOpenhimTransaction(
        transactionId,
        'Failed',
        503,
        { message: "Failed reprocessing", error: error.message, indices: validatedParameters.indices, from: validatedParameters.reprocessFromDate, to: validatedParameters.reprocessToDate }
      )
      logger.info(
        `Failed to reprocess ES Indices: [ ${validatedParameters.indices} ] | From: ${validatedParameters.reprocessFromDate} | To: ${validatedParameters.reprocessToDate}. Error - ${error.message}`
      )
    })

  const returnObject = buildReturnObject(
    'Processing',
    200,
    { message: "In Progress", indices: validatedParameters.indices, from: validatedParameters.reprocessFromDate, to: validatedParameters.reprocessToDate }
  )
  logger.info(
    `Reprocessing ES Indices: [ ${validatedParameters.indices} ] | From: ${validatedParameters.reprocessFromDate} | To: ${validatedParameters.reprocessToDate}`
  )
  res.set('Content-Type', 'application/json+openhim')
  return res.send(returnObject)
}

function validateReprocessParameters(inputParams) {
  if (!inputParams) {
    throw new Error(`Argument Error: No params received: ${inputParams}`)
  }
  const outputParams = {
    reprocessToDate: inputParams.reprocessToDate.format(),
    reprocessFromDate: inputParams.reprocessFromDate.format(),
  };

  if (
    moment(outputParams.reprocessToDate).isBefore(
      outputParams.reprocessFromDate
    )
  ) {
    const errMessage = `Argument Error: Invalid Period. ReprocessToDate: ${outputParams.reprocessToDate} is before ReprocessFromDate: ${outputParams.reprocessFromDate}`
    logger.error(errMessage)
    throw new Error(errMessage)
  }

  const indices = validateIndices(inputParams)

  if (!indices.length) {
    const errMessage = `No Elastic Search index specified for reprocessing`
    logger.error(errMessage)
    throw new Error(`Argument Error: ${errMessage}`)
  }

  outputParams.indices = indices

  return outputParams
}

function validateIndices(inputParams) {
  const indices = []

  if (inputParams.all) {
    indices.push(
      FHIR_RAW_CAREPLAN,
      FHIR_RAW_ENCOUNTER,
      FHIR_RAW_MEDICATIONDISPENSE,
      FHIR_RAW_MEDICATIONSTATEMENT,
      FHIR_RAW_PATIENT,
      FHIR_RAW_PROCEDURE,
      FHIR_RAW_QUESTIONNAIRERESPONSE,
      FHIR_RAW_RELATEDPPERSON,
      FHIR_RAW_SERVICEREQUEST,
      FHIR_RAW_DIAGNOSTICREPORT,
      FHIR_RAW_OBSERVATION,
    )
    return indices
  }

  if (inputParams.carePlan) indices.push(FHIR_RAW_CAREPLAN)
  if (inputParams.encounter) indices.push(FHIR_RAW_ENCOUNTER)
  if (inputParams.medicationDispense) indices.push(FHIR_RAW_MEDICATIONDISPENSE)
  if (inputParams.medicationStatement)
    indices.push(FHIR_RAW_MEDICATIONSTATEMENT)
  if (inputParams.patient) indices.push(FHIR_RAW_PATIENT)
  if (inputParams.procedure) indices.push(FHIR_RAW_PROCEDURE)
  if (inputParams.questionnaireResponse)
    indices.push(FHIR_RAW_QUESTIONNAIRERESPONSE)
  if (inputParams.relatedPerson) indices.push(FHIR_RAW_RELATEDPPERSON)
  if (inputParams.serviceRequest) indices.push(FHIR_RAW_SERVICEREQUEST)
  if (inputParams.diagnosticReport) indices.push(FHIR_RAW_DIAGNOSTICREPORT)
  if (inputParams.observation) indices.push(FHIR_RAW_OBSERVATION)

  return indices
}

async function reprocessIndexes(params) {
  const currentlyExecuting = []
  const allPromises = []

  const reprocessIndex = async index => {
    const pitData = await postToESWithPIT(index)
    if (!pitData) return

    logger.info(`Generated ES Index PIT for ${index}`)
    const { url, data } = prepareInputOrchestration(
      params.reprocessFromDate,
      params.reprocessToDate,
      pitData.body.id,
    )
    return orchestrateDataReprocessing(url, data).catch((error) => {
      throw error
    })
  }

  for (const index of params.indices) {
    const promise = makeQuerablePromise(reprocessIndex(index))
    currentlyExecuting.push(promise)
    allPromises.push(promise)

    if (currentlyExecuting.length === KAFKA_CONCURRENCY) {
      // Wait for at least one promise to settle
      await Promise.race(currentlyExecuting)
      for (const [index, promise] of currentlyExecuting.entries()) {
        if (promise.isSettled()) {
          currentlyExecuting.splice(index, 1)
        }
      }
    }
  }

  return Promise.all(allPromises).catch((error) => {
    throw error
  })
}

function prepareInputOrchestration(fromDate, toDate, pitId) {
  const config = {
    url: `${ES_URL}/_search`,
    data: {
      pit: {
        id: pitId,
        keep_alive: '10s'
      },
      query: {
        range: {
          '@timestamp': {
            gte: fromDate,
            lte: toDate,
            boost: 2
          }
        }
      },
      size: ES_HIT_SIZE,
      sort: [
        {
          '@timestamp': {
            order: 'asc',
            format: 'strict_date_optional_time_nanos',
            numeric_type: 'date_nanos'
          }
        }
      ],
      track_total_hits: false
    }
  }

  return config
}

async function orchestrateDataReprocessing(url, data) {
  try {
    logger.trace(
      `Retrieve ES Data from: ${url} with config: ${JSON.stringify(data)}`
    )
    const response = await postToES(data)
    if (!response) return

    const responseData = response.body

    if (responseData.hits.hits.length) {
      await sendRawData(responseData.hits.hits)

      const searchAfter =
        responseData.hits.hits[responseData.hits.hits.length - 1].sort
      logger.debug(`Search next frame after: ${searchAfter}`)
      data.search_after = searchAfter

      await orchestrateDataReprocessing(url, data)
    }
  } catch (error) {
    throw error
  }
}

function postToES(data) {
  return client
    .search({
      body: data
    })
    .then((response) => response)
    .catch((error) => {
      if (error.message.includes('status code 404') ||
        error.message.includes('index_not_found_exception')
      ) {
        logger.error(`ES Index not found. ${error.message}`)
      } else if (
        error.message.includes('connect ECONNREFUSED') ||
        error.message.includes('getaddrinfo EAI_AGAIN')
      ) {
        const errMessage = `ES not accessible: ${error.message}`
        logger.error(errMessage)
        throw new Error(errMessage)
      } else {
        throw error
      }
    })
}

function postToESWithPIT(index) {
  return client
    .openPointInTime({
      index,
      keep_alive: '10s'
    })
    .then((response) => response)
    .catch((error) => {
      if (error.message.includes('status code 404') ||
        error.message.includes('index_not_found_exception')
      ) {
        logger.error(`ES Index not found. ${error.message}`)
      } else if (
        error.message.includes('connect ECONNREFUSED') ||
        error.message.includes('getaddrinfo EAI_AGAIN')
      ) {
        const errMessage = `ES not accessible: ${error.message}`
        logger.error(errMessage)
        throw new Error(errMessage)
      } else {
        throw error
      }
    })
}

function sendRawData(data) {
  logger.info(
    `Sending ${data.length} ${data[0]._index.replace(
      'fhir-raw-',
      ''
    )} resources to Kafka`
  )

  const simplifiedESData = data.map((hit) => hit._source)

  const message = IS_LOGSTASH_DRIVER
    ? simplifiedESData
    : {
      resourceType: "Bundle",
      id: "bundle-transaction",
      type: "transaction",
      entry: simplifiedESData,
      reprocess: true
    };

  const promise = new Promise((resolve, reject) => {
    sendDataToKafka(message, reject, resolve, KAFKA_REPROCESSING_TOPIC)
  });

  return promise.catch((error) => {
    const errMessage = `Request Error: ${error.message
      }. Failed to send ${data[0]._index.replace(
        'fhir-raw-',
        ''
      )} resources to Kafka. Replay resources from @timestamp: ${data[0].sort[0]}`
    logger.error(errMessage)
    throw new Error(errMessage)
  })
}
