'use strict'

import { LOG_LEVEL} from './config/config.mjs';
import pino, {stdSerializers} from 'pino'

export default pino({
  timestamp: pino.stdTimeFunctions.isoTime,
  level: LOG_LEVEL,
  prettyPrint: true,
  serializers: {
    err: stdSerializers.err
  }
})
