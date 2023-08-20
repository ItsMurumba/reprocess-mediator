import mongoose from 'mongoose'
import logger from '../logger.mjs';
import { sendDataToKafka } from './kafka.mjs';
import { KAFKA_2XX_TOPIC } from '../config/config.mjs';

logger.info('Now connecting to MongoDB');
await mongoose.connect('mongodb://localhost:27017/openhim-development',{
    directConnection: true,
}).then(() => logger.info('Connection Successful'))
.catch(err => logger.error(`Failed to Connect: ${err.message}`));

export async function reprocessFHIRTransactions({reprocessFromDate, reprocessToDate, transactionRequestMethod='ALL'}){
    const method = transactionRequestMethod.toLocaleUpperCase();

    const query = mongoose.connection.db.collection('transactions').find({
        status: 'Successful',
        'request.path': '/fhir',
        ...(['POST', 'DELETE'].includes(method) ? { 'request.method': method.toUpperCase() }: null),
        'request.timestamp': {
            $gte: new Date(reprocessFromDate),
            $lte: new Date(reprocessToDate),
        }
    }).sort({ 'request.method': -1, 'request.timestamp': 1})
    
    // count() method on Mongodb's FindCursor class is deprecated and will require querying the database again so I figure this is faster.
    let count = 0;

    for await (const openHimTransaction of query){
        try {
           await new Promise((resolve, reject) => {
                sendDataToKafka(
                    openHimTransaction.request.body,
                    reject,
                    resolve,
                    KAFKA_2XX_TOPIC)});
            count++;
        } catch (error) {
            logger.error(`Failed to push to Kafka. Error Message: ${error.message}`);
            throw Error(error.message)
        }
    }

    return count;
}