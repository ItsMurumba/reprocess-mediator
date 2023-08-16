import mongoose from 'mongoose'
import logger from '../logger.mjs';
import { sendDataToKafka } from './kafka.mjs';

logger.info('Now connecting to MongoDB');
await mongoose.connect('mongodb://localhost:27017/openhim-development',{
    directConnection: true,
}).then(() => logger.info('Connection Successful'))
.catch(err => logger.error(`Failed to Connect: ${err.message}`));

export async function findFHIRTransactions({reprocessFromDate, reprocessToDate, method='ALL'}){
    const openhimFHIRTransactions = await mongoose.connection.db.collection('transactions').find({
        status: 'Successful',
        'request.path': '/fhir',
        ...(method.toLocaleUpperCase() === 'ALL' ? null: { method }),
        'request.timestamp': {
            $gte: new Date(reprocessFromDate),
            $lte: new Date(reprocessToDate),
        }
    }).toArray();

    logger.info(`${openhimFHIRTransactions.length}: transactions found`);

    return openhimFHIRTransactions.reduce((acc, cur)=>{
        const requestMethod = cur.request.method;
        const postArrayTuple = acc[0];
        const deleteArrayTuple = acc[1];

        if(requestMethod === 'POST'){
            postArrayTuple.push(cur.request.body);
        }
        if (requestMethod === 'DELETE') {
            deleteArrayTuple.push(cur.request.body)
        }

        return [postArrayTuple, deleteArrayTuple];
    },[[],[]]);
}

export async function pushDataToKafka(fhirTransactions = [[],[]]){
    const postTransactions = fhirTransactions[0];
    const deleteTransactions = fhirTransactions[1];

    if(postTransactions.length === 0 && deleteTransactions.length === 0){
        throw new Error('No Transactions to Reprocess')
    }

    const sendToKafkaPromise =  new Promise((resolve, reject) => {
        logger.info(typeof resolve)
        logger.info(typeof reject)
        sendDataToKafka(
            postTransactions[0],
            reject,
            resolve,
            '2xx'
        )
    });

    sendToKafkaPromise
    .then(data => logger.info(data))
    .catch(err => console.error(err.message));
}

const data = await findFHIRTransactions({reprocessFromDate: '1970-01-01', reprocessToDate: '2023-12-31', method: 'ALL'})
try {
    await pushDataToKafka(data);
} catch (error) {
    logger.error(error.message)
}