const { createWorker } = require('@core/keystone/tasks')
require('./index')  // we need to register Task!

createWorker()
