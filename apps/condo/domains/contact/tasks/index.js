const { createTask } = require('@open-condo/keystone/tasks')

const { exportContacts } = require('./exportContacts')

module.exports = {
    exportContactsTask: createTask('exportContacts', exportContacts, { priority: 2 }),
}