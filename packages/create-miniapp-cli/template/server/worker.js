const { createWorker } = require('@open-condo/keystone/tasks')

const index = require('./index')

createWorker(index)
    .catch((error) => {
        console.error(error)
        process.exit(2)
    })
