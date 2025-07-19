const { createTask } = require('@open-condo/keystone/tasks')

const { executeAIFlow } = require('./executeAIFlow')


module.exports = {
    executeAIFlow: createTask('executeAIFlow', executeAIFlow),
}
