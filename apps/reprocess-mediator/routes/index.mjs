'use strict'

import express from 'express'

import {buildReturnObject} from './utils.mjs'

import logger from '../logger.mjs'
import reprocessRoute from './reprocessRoute.mjs'
import { getHandler, postHandler } from "./mongodbRoute.mjs";
import cors from 'cors';

const routes = express.Router()
routes.use(cors());

routes.get('/reprocess/mongo', getHandler);
routes.post('/reprocess/mongo', postHandler);
routes.post('/reprocess', reprocessRoute)

// Any request regardless of request type or url path to the mediator port will be caught here
// and trigger the canned response. It may be useful in diagnosing incorrectly configured
// channels from the OpenHIM Console.
routes.all('*', (req, res) => {
  logger.error(
    `Failed! Endpoint "${req.url}" & HTTP method "${req.method}" combination not found.`
  )

  const returnObject = buildReturnObject('Failed', 404, {
    message: 'Combination not found',
    url: req.url,
    method: req.method
  })
  res.set('Content-Type', 'application/json+openhim')
  res.status(404).send(returnObject)
})

export default routes
