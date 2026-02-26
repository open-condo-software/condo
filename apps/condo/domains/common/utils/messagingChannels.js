const { find } = require('@open-condo/keystone/schema')

/**
 * Checks whether a user is an active employee of the given organization.
 * Active = accepted, not rejected, not blocked, not soft-deleted.
 *
 * @param {Object} context - Keystone context (with skipAccessControl)
 * @param {string} userId
 * @param {string} organizationId
 * @returns {Promise<boolean>}
 */
async function isActiveEmployee (context, userId, organizationId) {
    const employees = await find('OrganizationEmployee', {
        user: { id: userId },
        organization: { id: organizationId },
        isAccepted: true,
        isRejected: false,
        isBlocked: false,
        deletedAt: null,
    })
    return employees.length > 0
}

module.exports = { isActiveEmployee }
