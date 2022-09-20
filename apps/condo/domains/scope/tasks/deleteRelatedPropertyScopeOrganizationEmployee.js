const { getSchemaCtx, find } = require('@condo/keystone/schema')
const { createTask } = require('@condo/keystone/tasks')
const { PropertyScopeOrganizationEmployee } = require('@condo/domains/scope/utils/serverSchema')

/**
 * Soft delete related PropertyScopeOrganizationEmployee after delete PropertyScope object
 */
// TODO(DOMA-4152): write deleteRelatedPropertyScopeEntities function and load by chunks
async function deleteRelatedPropertyScopeOrganizationEmployee (deletedPropertyScope, deletedMeterAt) {
    const { keystone: context } = await getSchemaCtx('Property')

    const propertyScopeId = deletedPropertyScope.id
    const propertyScopeOrganizationEmployees = await find('PropertyScopeOrganizationEmployee', {
        propertyScope: { id: propertyScopeId },
        deletedAt: null,
    })

    for (const propertyScopeOrganizationEmployee of propertyScopeOrganizationEmployees) {
        await PropertyScopeOrganizationEmployee.update(context, propertyScopeOrganizationEmployee.id, {
            deletedAt: deletedMeterAt,
            dv: deletedPropertyScope.dv,
            sender: deletedPropertyScope.sender,
        })
    }
}

module.exports = {
    deleteRelatedPropertyScopeOrganizationEmployee: createTask('deleteRelatedPropertyScopeOrganizationEmployee', deleteRelatedPropertyScopeOrganizationEmployee),
}
