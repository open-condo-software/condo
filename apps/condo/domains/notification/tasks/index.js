const { createTask } = require('@open-condo/keystone/tasks')

const { deliverMessage } = require('./deliverMessage')
const { sendMessageBatch } = require('./sendMessageBatch')

module.exports = {
    deliverMessageTask: createTask('deliverMessage', deliverMessage, { priority: 1 }),
    sendMessageBatchTask: createTask('sendMessageBatch', sendMessageBatch, { priority: 5 }),
}