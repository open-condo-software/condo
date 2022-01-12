const { createWorker } = require('@core/keystone/tasks')

createWorker(require('./index')).catch((error) => {
    console.error(error)
    process.exit(2)
})
