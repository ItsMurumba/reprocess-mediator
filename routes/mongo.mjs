import mongoose from 'mongoose'
import logger from '../logger.mjs';
import { sendDataToKafka } from './kafka.mjs';

logger.info('Now connecting to MongoDB');
await mongoose.connect('mongodb://localhost:27017/openhim-development',{
    directConnection: true,
}).then(() => logger.info('Connection Successful'))
.catch(err => logger.error(`Failed to Connect: ${err.message}`));

export async function findFHIRTransactions({reprocessFromDate, reprocessToDate, transactionRequestMethod='ALL'}){
    const method = transactionRequestMethod.toLocaleUpperCase();

    const openhimFHIRTransactions = await mongoose.connection.db.collection('transactions').find({
        status: 'Successful',
        'request.path': '/fhir',
        ...(['POST', 'DELETE'].includes(method) ? { method }: null),
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

export async function pushTransactionsToKafka(fhirTransactions = [[],[]]){
    const postTransactions = fhirTransactions[0];
    const deleteTransactions = fhirTransactions[1];

    if(postTransactions.length === 0 && deleteTransactions.length === 0){
        throw new Error('No Transactions to Reprocess')
    }

    const sendToKafkaPromise =  new Promise((resolve, reject) => {
        sendDataToKafka(
            postTransactions[0],
            reject,
            resolve,
            '2xx'
        )
    })
    .then((data) => logger.info(`Data pushed to kafka`))
    .catch((err) => logger.error(`Failed to push to Kafka ${err.message}`))
}