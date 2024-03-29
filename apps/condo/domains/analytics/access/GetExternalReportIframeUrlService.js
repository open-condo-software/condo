/**
 * Generated by `createservice analytics.GetExternalReportIframeUrlService`
 */
const isEmpty = require('lodash/isEmpty')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { find } = require('@open-condo/keystone/schema')

const { checkUserBelongsToOrganization } = require('@condo/domains/organization/utils/accessSchema')
const { queryOrganizationEmployeeFor, queryOrganizationEmployeeFromRelatedOrganizationFor } = require('@condo/domains/organization/utils/accessSchema')

async function canGetExternalReportIframeUrl ({ authentication: { item: user }, args: { data: { id, organizationId } } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return {}

    const userBelongsToOrganization = await checkUserBelongsToOrganization(user.id, organizationId)
    if (!userBelongsToOrganization) return false

    const externalReport = await find('ExternalReport', {
        id,
        OR: [
            { organization_is_null: true },
            { organization: queryOrganizationEmployeeFor(user.id, 'canReadExternalReports') },
            { organization: queryOrganizationEmployeeFromRelatedOrganizationFor(user.id, 'canReadExternalReports') },
        ],
        deletedAt: null,
    })

    return !isEmpty(externalReport)
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canGetExternalReportIframeUrl,
}
