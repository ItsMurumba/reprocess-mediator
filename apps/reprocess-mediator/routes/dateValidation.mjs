import moment from 'moment'
import logger from '../logger.mjs'

export const validateDateRanges = (reprocess_fhir_resources) => {
    return {
      ...reprocess_fhir_resources,
      reprocessFromDate: validateDateTime(
        reprocess_fhir_resources.reprocessFromDate,
        '1970-01-01'
      ),
      reprocessToDate:validateDateTime(
        reprocess_fhir_resources.reprocessToDate,
        moment()
      )
    }
  }
  
  
  function validateDateTime(dateTime, defaultDate) {
    if (dateTime) {
      if (!moment(dateTime, moment.ISO_8601).isValid()) {
        const errMessage = `Argument Error: Invalid Date. Failed to parse a date parameter (${dateTime})`
        logger.error(errMessage)
        throw new Error(errMessage)
      }
      return moment(dateTime, moment.ISO_8601)
    } else {
      logger.warn(`Date not provided. Default ${defaultDate}`)
      return moment(defaultDate, moment.ISO_8601)
    }
  }
