const { createTask } = require('@open-condo/keystone/tasks')

const { deleteRelatedPropertyScopeOrganizationEmployee } = require('./deleteRelatedPropertyScopeOrganizationEmployee')
const { deleteRelatedPropertyScopeProperty } = require('./deleteRelatedPropertyScopeProperty')

module.exports = {
    deleteRelatedPropertyScopeOrganizationEmployeeTask: createTask('deleteRelatedPropertyScopeOrganizationEmployee', deleteRelatedPropertyScopeOrganizationEmployee),
    deleteRelatedPropertyScopePropertyTask: createTask('deleteRelatedPropertyScopeProperty', deleteRelatedPropertyScopeProperty),
}