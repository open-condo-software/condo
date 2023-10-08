const { getSchemaCtx, find } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { PropertyScopeOrganizationEmployee } = require('@condo/domains/scope/utils/serverSchema')

/**
 * Soft delete related PropertyScopeOrganizationEmployee after delete PropertyScope object
 */
async function deleteRelatedPropertyScopeOrganizationEmployee (deletedPropertyScope, deletedPropertyScopeAt) {
    const { keystone: context } = await getSchemaCtx('Property')

    const propertyScopeId = deletedPropertyScope.id
    const propertyScopeOrganizationEmployees = await find('PropertyScopeOrganizationEmployee', {
        propertyScope: { id: propertyScopeId },
        deletedAt: null,
    })

    for (const propertyScopeOrganizationEmployee of propertyScopeOrganizationEmployees) {
        await PropertyScopeOrganizationEmployee.update(context, propertyScopeOrganizationEmployee.id, {
            deletedAt: deletedPropertyScopeAt,
            dv: deletedPropertyScope.dv,
            sender: deletedPropertyScope.sender,
        })
    }
}

module.exports = {
    deleteRelatedPropertyScopeOrganizationEmployee: createTask('deleteRelatedPropertyScopeOrganizationEmployee', deleteRelatedPropertyScopeOrganizationEmployee),
}
