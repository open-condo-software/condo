const { GQLError, GQLErrorCode: { BAD_USER_INPUT, INTERNAL_ERROR } } = require('@open-condo/keystone/errors')
const { GQLCustomSchema, find } = require('@open-condo/keystone/schema')

const { getAccessTokenForUser } = require('@condo/domains/organization/integrations/sbbol/utils')
const access = require('@condo/domains/user/access/GetAccessTokenByUserIdService')


/**
 * List of possible errors, that this custom schema can throw
 * They will be rendered in documentation section in GraphiQL for this custom schema
 */
const ERRORS = {
    REFRESH_TOKEN_EXPIRED: {
        query: 'GetAccessTokenByUserIdService',
        code: INTERNAL_ERROR,
        type: 'REFRESH_TOKEN_EXPIRED',
        message: 'SBBOL user refreshToken expired',
        messageForUser: 'api.user.getAccessTokenByUserId.REFRESH_TOKEN_EXPIRED',
    },
    ORGANIZATION_DO_NOT_HAS_USER_AS_EMPLOYEE: {
        query: 'GetAccessTokenByUserIdService',
        code: BAD_USER_INPUT,
        type: 'INVALID_USER_AND_ORGANIZATION_ID',
        message: 'User do not have a connection to the organization',
        messageForUser: 'api.user.getAccessTokenByUserId.INVALID_USER_AND_ORGANIZATION_ID',
    },
    ERROR_GETTING_ACCESS_TOKEN: {
        query: 'GetAccessTokenByUserIdService',
        code: INTERNAL_ERROR,
        type: 'ERROR_GETTING_ACCESS_TOKEN',
        message: 'Unresolved error in getAccessTokenForUser',
        messageForUser: 'api.user.getAccessTokenByUserId.ERROR_GETTING_ACCESS_TOKEN',
    },
}

const GetAccessTokenByUserIdService = new GQLCustomSchema('GetAccessTokenByUserIdService', {
    types: [
        {
            access: true,
            type: 'input GetAccessTokenByUserIdInput { user: UserWhereUniqueInput!, type: ExternalTokenAccessRightTypeType!, organization: OrganizationWhereUniqueInput }',
        },
        {
            access: true,
            type: 'type GetAccessTokenByUserIdOutput { accessToken: ID!, ttl: Int! }',
        },
    ],

    queries: [
        {
            access: access.canGetAccessTokenByUserId,
            doc: {
                description: 'To get a token for a specific user, you need to call this query, specifying the required integration type and userId in the parameters. ' +
                    'For some integrations (like SBBOL) there are different accounts for the same user and different Organizations' +
                    'We can pass organization.id together with user.id to get correct access token' +
                    'To pass the rights check, you need to request on behalf of the service user,' +
                    'and also have an entry in the ExternalTokenAccessRight table that regulates access to tokens of different integrations',
                errors: ERRORS,
            },
            schema: 'getAccessTokenByUserId (data: GetAccessTokenByUserIdInput!): GetAccessTokenByUserIdOutput',
            resolver: async (parent, args, context) => {
                const { data: { user: { id: userId }, organization: { id: organizationId } = {} } } = args

                if (organizationId) {
                    const [employee] = await find('OrganizationEmployee', { user: { id: userId }, organization: { id: organizationId } })
                    if (!employee) {
                        throw new GQLError(ERRORS.ORGANIZATION_DO_NOT_HAS_USER_AS_EMPLOYEE, context)
                    }
                }
                let accessToken, ttl, error
                try {
                    ({ accessToken, ttl, error } = await getAccessTokenForUser({ userId, organizationId }, false))
                } catch (e) {
                    throw new GQLError(ERRORS.ERROR_GETTING_ACCESS_TOKEN, context)
                }
                if (error){
                    if (error === 'REFRESH_TOKEN_EXPIRED') {
                        throw new GQLError(ERRORS.REFRESH_TOKEN_EXPIRED, context)
                    }
                    throw new GQLError(ERRORS.ERROR_GETTING_ACCESS_TOKEN, context)
                }
                return { accessToken, ttl }
            },
        },
    ],

})

module.exports = {
    GetAccessTokenByUserIdService,
}