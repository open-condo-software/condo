const { createTask } = require('@open-condo/keystone/tasks')

const { sendResidentMessage } = require('./helpers')

const sendResidentMessageTask = createTask('sendResidentMessageTask', sendResidentMessage)

module.exports = {
    sendResidentMessageTask,
}