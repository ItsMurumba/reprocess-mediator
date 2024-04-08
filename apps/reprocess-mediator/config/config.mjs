'use strict'

import { stringToInt } from '../routes/utils.mjs'

export const SERVER_PORT = process.env.SERVER_PORT || 3000

export const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

// OpenHIM
export const OPENHIM_MEDIATOR_URL =
  process.env.OPENHIM_MEDIATOR_URL || 'https://localhost:8080'
export const OPENHIM_TRANSACTION_URL =
  process.env.OPENHIM_TRANSACTION_URL || 'http://localhost:5001'
export const OPENHIM_USERNAME =
  process.env.OPENHIM_USERNAME || 'root@openhim.org'
export const OPENHIM_PASSWORD = process.env.OPENHIM_PASSWORD || 'wPu8V38ibZy*0&m0'
export const OPENHIM_CLIENT_CUSTOM_TOKEN =
  process.env.OPENHIM_CLIENT_CUSTOM_TOKEN || 'test'

export const TRUST_SELF_SIGNED = process.env.TRUST_SELF_SIGNED || true

// Elastic Search

export const FHIR_RAW_CAREPLAN = 'fhir-raw-careplan'
export const FHIR_RAW_ENCOUNTER = 'fhir-raw-encounter'
export const FHIR_RAW_PROCEDURE = 'fhir-raw-procedure'
export const FHIR_RAW_MEDICATIONDISPENSE = 'fhir-raw-medicationdispense'
export const FHIR_RAW_MEDICATIONSTATEMENT = 'fhir-raw-medicationstatement'
export const FHIR_RAW_PATIENT = 'fhir-raw-patient'
export const FHIR_RAW_QUESTIONNAIRERESPONSE = 'fhir-raw-questionnaireresponse'
export const FHIR_RAW_SERVICEREQUEST = 'fhir-raw-servicerequest'
export const FHIR_RAW_RELATEDPPERSON = 'fhir-raw-relatedperson'
export const FHIR_RAW_DIAGNOSTICREPORT = 'fhir-raw-diagnosticreport'
export const FHIR_RAW_OBSERVATION = 'fhir-raw-observation'

export const ES_URL = process.env.ES_URL || 'http://localhost:9201'
export const ES_USERNAME = process.env.ES_USERNAME || 'elastic'
export const ES_PASSWORD = process.env.ES_PASSWORD || 'dev_password_only'
export const ES_HIT_SIZE = stringToInt(process.env.ES_HIT_SIZE, 1000)
export const ES_HOSTS =
  process.env.ES_HOSTS || 'analytics-datastore-elastic-search:9200'

export const IS_LOGSTASH_DRIVER = Boolean(process.env.IS_LOGSTASH_DRIVER === 'true');

// Kafka

export const KAFKA_CONCURRENCY = stringToInt(process.env.KAFKA_CONCURRENCY, 2)
export const KAFKA_REPROCESSING_TOPIC =
  process.env.KAFKA_REPROCESSING_TOPIC || 'reprocess'
export const KAFKA_2XX_TOPIC = process.env.KAFKA_2XX_TOPIC || '2xx'
export const KAFKA_URL = process.env.KAFKA_URL || 'kafka-01:9092'

// MongoDB

export const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost/openhim';
export const MONGODB_DIRECT_CONNECTION = process.env.MONGODB_DIRECT_CONNECTION || false;
