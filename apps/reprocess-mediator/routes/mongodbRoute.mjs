import { queryOpenhimTransactions, pushMessagesToKafka } from './mongo.mjs';

export async function getHandler(req, res) {
  const { query } = req

  const validatedQuery = validateReprocessingOptions(query);

  if (validatedQuery.error) {
    return res.status(400).json({ error: validatedQuery.error })
  }

  // Get the results from MongoDB
  const { numberOfFhirResources, numberOfTransactions } = await queryOpenhimTransactions(validatedQuery);

  return res.json({
    ...validatedQuery,
    numberOfFhirResources,
    numberOfTransactions
  })
}

export async function postHandler(req, res) {
  const { body } = req;

  const validatedBody = validateReprocessingOptions(body);
  if (validatedBody.error) {
    return res.status(400).json({ error: validatedBody.error })
  }

  if (validatedBody.method === 'POST') {
    const {
      numberOfTransactions,
      requestBodies
    } = await queryOpenhimTransactions(validatedBody);

    const failedCounter = await pushMessagesToKafka(requestBodies);

    return res.json({
      message: `Successfully Reprocessed ${numberOfTransactions - failedCounter} of ${numberOfTransactions} Transactions`,
    });
  }
  else if (validatedBody.method === 'DELETE') {
    const {
      numberOfTransactions,
      requests
    } = await queryOpenhimTransactions(validatedBody);

    const failedCounter = await pushMessagesToKafka(requests);

    return res.json({
      message: `Successfully Reprocessed ${numberOfTransactions - failedCounter} of ${numberOfTransactions} Transactions`,
    });
  }
  else {
    return res.status(400).json({ error: "Invalid method" });
  }
}


function validateReprocessingOptions(reprocessingOptions) {
  if (!reprocessingOptions.reprocessFromDate || !reprocessingOptions.reprocessToDate) {
    return {
      error: "reprocessFromDate and reprocessToDate are required",
    };
  }

  const resources = reprocessingOptions?.resources;

  return {
    fromDate: reprocessingOptions.reprocessFromDate,
    toDate: reprocessingOptions.reprocessToDate,
    method: reprocessingOptions.method || null,
    resources,
  };
}
