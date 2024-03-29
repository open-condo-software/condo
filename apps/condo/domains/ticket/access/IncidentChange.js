/**
 * Generated by `createschema ticket.IncidentChange 'incident:Relationship:Incident:CASCADE;'`
 */

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { queryOrganizationEmployeeFor, queryOrganizationEmployeeFromRelatedOrganizationFor } = require('@condo/domains/organization/utils/accessSchema')


async function canReadIncidentChanges ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return {}

    return {
        incident: {
            organization: {
                OR: [
                    queryOrganizationEmployeeFor(user.id, 'canReadIncidents'),
                    queryOrganizationEmployeeFromRelatedOrganizationFor(user.id, 'canReadIncidents'),
                ],
            },
        },
    }
}

async function canManageIncidentChanges () {
    return false
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canReadIncidentChanges,
    canManageIncidentChanges,
}
