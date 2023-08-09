const { get } = require('lodash')
const compact = require('lodash/compact')
const uniq = require('lodash/uniq')

const conf = require('@open-condo/config')
const { find, getByCondition, getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { TICKET_CREATED_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { ORGANIZATION_TICKET_VISIBILITY, PROPERTY_TICKET_VISIBILITY, PROPERTY_AND_SPECIALIZATION_VISIBILITY } = require('@condo/domains/organization/constants/common')

/**
 * Sends push notifications about ticket creation to organization employees
 */
const sendCreateTicketNotificationsToEmployees = async ({ newItem }) => {
    const { keystone: context } = await getSchemaCtx('Ticket')

    const createdBy = get(newItem, 'createdBy')
    const organizationId = get(newItem, 'organization', null)

    const organization = await getByCondition('Organization', {
        id: organizationId,
        deletedAt: null,
    })
    const organizationCountry = get(organization, 'country', conf.DEFAULT_LOCALE)
    const lang = get(COUNTRIES, [organizationCountry, 'locale'], conf.DEFAULT_LOCALE)

    const employeeUsersToSendNotification = []

    const baseEmployeesQuery = {
        organization: { id: organizationId, deletedAt: null },
        deletedAt: null,
        isRejected: false,
        isBlocked: false,
    }
    const employeesWithOrganizationTicketVisibility = await find('OrganizationEmployee', {
        ...baseEmployeesQuery,
        role: {
            ticketVisibilityType: ORGANIZATION_TICKET_VISIBILITY,
        },
    })
    const employeesWithPropertyTicketVisibility = await find('OrganizationEmployee', {
        ...baseEmployeesQuery,
        role: {
            ticketVisibilityType: PROPERTY_TICKET_VISIBILITY,
        },
    })
    const employeesWithPropertyAndSpecializationTicketVisibility = await find('OrganizationEmployee', {
        ...baseEmployeesQuery,
        role: {
            ticketVisibilityType: PROPERTY_AND_SPECIALIZATION_VISIBILITY,
        },
    })

    const ticketProperty = get(newItem, 'property')
    const ticketCategory = get(newItem, 'categoryClassifier')

    const organizationPropertyScopes = await find('PropertyScope', {
        organization: { id: organizationId, deletedAt: null },
        deletedAt: null,
    })
    const employeeSpecializations = await find('OrganizationEmployeeSpecialization', {
        employee: { id_in: employeesWithPropertyAndSpecializationTicketVisibility.map(obj => obj.id), deletedAt: null },
        specialization: { id: ticketCategory, deletedAt: null },
        deletedAt: null,
    })
    const employeesWithMatchedCategory = await find('OrganizationEmployee', {
        id_in: compact(employeeSpecializations.map(obj => get(obj, 'employee', null))),
        deletedAt: null,
    })

    // all employees with organization ticket visibility, because they are visible all organization tickets
    employeeUsersToSendNotification.push(...(employeesWithOrganizationTicketVisibility.map(employee => employee.user)))
    // assignee and executor of ticket (ASSIGNED_TICKET_VISIBILITY)
    employeeUsersToSendNotification.push(...[newItem.assignee, newItem.executor])

    const isDefaultScopeExists = organizationPropertyScopes.find(scope => scope.hasAllProperties && scope.hasAllEmployees)

    if (isDefaultScopeExists) {
        employeeUsersToSendNotification.push(...(employeesWithPropertyTicketVisibility.map(employee => employee.user)))
        employeeUsersToSendNotification.push(...(employeesWithMatchedCategory.map(employee => employee.user)))
    } else {
        const propertyScopeProperties = await find('PropertyScopeProperty', {
            propertyScope: { id_in: organizationPropertyScopes.map(scope => scope.id), deletedAt: null },
            property: { id: ticketProperty, deletedAt: null },
            deletedAt: null,
        })
        const scopesWithTicketProperty = organizationPropertyScopes.filter(
            scope => propertyScopeProperties.find(obj => obj.propertyScope === scope.id) || scope.hasAllProperties
        )

        if (scopesWithTicketProperty.find(scope => scope.hasAllEmployees)) {
            employeeUsersToSendNotification.push(...(employeesWithPropertyTicketVisibility.map(employee => employee.user)))
            employeeUsersToSendNotification.push(...(employeesWithMatchedCategory.map(employee => employee.user)))
        } else {
            const propertyScopeOrganizationEmployees = await find('PropertyScopeOrganizationEmployee', {
                deletedAt: null,
                propertyScope: { id_in: scopesWithTicketProperty.map(scope => scope.id) },
            })

            const matchedEmployeesWithPropertyVisibility = employeesWithPropertyTicketVisibility
                .filter(employee => propertyScopeOrganizationEmployees.find(obj => obj.employee === employee.id))
            employeeUsersToSendNotification.push(...(matchedEmployeesWithPropertyVisibility.map(employee => employee.user)))

            const matchedCategoryAndPropertyEmployees = employeesWithMatchedCategory
                .filter(employee => propertyScopeOrganizationEmployees.find(obj => obj.employee === employee.id))
            employeeUsersToSendNotification.push(...(matchedCategoryAndPropertyEmployees.map(employee => employee.user)))
        }
    }

    const employeeUsers = uniq(compact(
        employeeUsersToSendNotification.filter(userId => userId !== createdBy)
    ))

    for (const userId of employeeUsers) {
        await sendMessage(context, {
            lang,
            to: { user: { id: userId } },
            type: TICKET_CREATED_TYPE,
            meta: {
                dv: 1,
                data: {
                    ticketId: newItem.id,
                    ticketNumber: newItem.number,
                    userId,
                    url: `${conf.SERVER_URL}/ticket/${newItem.id}`,
                    organization: organization.name,
                },
            },
            sender: newItem.sender,
            organization: { id: organization.id },
        })
    }
}

module.exports = {
    sendCreateTicketNotificationsToEmployees: createTask('sendCreateTicketNotificationsToEmployees', sendCreateTicketNotificationsToEmployees),
}
