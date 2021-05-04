const { createWorker } = require('@core/keystone/tasks')

createWorker(require('./index'))
    .catch(() => process.exit(2))
