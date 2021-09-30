const { generators } = require('openid-client') // certified openid client will all checks
const { SbbolUserInfoJSONValidation, SBBOL_SESSION_KEY } = require('@condo/domains/organization/sbbol/common')
const { SbbolOauth2Api } = require('@condo/domains/organization/sbbol/oauth2')
const { SbbolOrganization } = require('@condo/domains/organization/sbbol/sync')
const { JSON_SCHEMA_VALIDATION_ERROR } = require('@condo/domains/common/constants/errors')
const { getSchemaCtx } = require('@core/keystone/schema')
const { getItems } = require('@keystonejs/server-side-graphql-client')

class SbbolRoutes {
    constructor () {
        this.helper = new SbbolOauth2Api()
    }

    async startAuth (req, res, next) {
        // nonce: to prevent several callbacks from same request
        // state: to validate user browser on callback
        const checks = { nonce: generators.nonce(), state: generators.state() }
        req.session[SBBOL_SESSION_KEY] = checks
        await req.session.save()
        try {
            const redirectUrl = this.helper.authorizationUrlWithParams(checks)
            return res.redirect(redirectUrl)
        } catch (error) {
            return next(error)
        }
    }

    async completeAuth (req, res, next) {
        try {
            const tokenSet = await this.helper.fetchTokens(req, SBBOL_SESSION_KEY)
            const { keystone } = await getSchemaCtx('User')
            const { access_token } = tokenSet
            const userInfo = await this.helper.fetchUserInfo(access_token)
            if (!SbbolUserInfoJSONValidation(userInfo)) {
                throw new Error(`${JSON_SCHEMA_VALIDATION_ERROR}] invalid json structure for userInfo`)
            }
            const Sync = new SbbolOrganization({ keystone, userInfo })
            await Sync.init()
            await Sync.syncUser()
            const userId = Sync.user.id
            keystone._sessionManager.startAuthedSession(req, { item: { id: userId }, list: keystone.lists['User'] })
            await Sync.syncOrganization()
            await Sync.updateTokens(tokenSet)
            const organizationLinkId = await Sync.getOrganizationEmployeeLinkId()
            res.cookie('organizationLinkId', organizationLinkId)
            delete req.session[SBBOL_SESSION_KEY]
            await req.session.save()

            const context = await keystone.createContext({ skipAccessControl: true })
            console.log('Loading subscriptions in doma.ai')
            const subscriptions = await getItems({
                context,
                listKey: 'ServiceSubscription',
                where: {
                    organization: {
                        id: Sync.organization.id,
                    },
                },
                returnFields: 'id',
            })
            if (subscriptions.length > 0) {
                console.log('User already have subscriptions')
            } else {
                console.log('No subscriptions found')
                console.log('Fetching subscribers and offers from SBBOL')
                const sbbolSubscribersInfo = await this.helper.fetchSubscribers(access_token)
                sbbolSubscribersInfo.offers.on('data', data => {
                    console.log('Reading `offers` response')
                    console.debug(data)
                })

                /*
                    By sending requests on any endpoint, following response will be received:

                    ```
                    --> GET https://edupirfintech.sberbank.ru:9443/v1/partner-info/advance-acceptances?clientId=111286&date=2021-10-28
                    --> HEADERS {
                      'user-agent': 'openid-client/4.7.4 (https://github.com/panva/node-openid-client)',
                      authorization: 'Bearer fbcbbb68-ca3a-4e64-a1a8-cce376a5e0f9-1',
                      'accept-encoding': 'gzip, deflate, br'
                    }
                    <-- 404 FROM GET https://edupirfintech.sberbank.ru:9443/v1/partner-info/advance-acceptances?clientId=111286&date=2021-10-28
                    <-- HEADERS {
                      'x-powered-by': 'Servlet/3.1',
                      'content-type': 'text/html',
                      'transfer-encoding': 'chunked',
                      connection: 'Close',
                      date: 'Tue, 28 Sep 2021 17:11:55 GMT'
                    }
                    <-- BODY <H1>SRVE0255E: A WebGroup/Virtual Host to handle /v1/partner-info/advance-acceptances has not been defined.</H1><BR><H3>SRVE0255E: A WebGroup/Virtual Host to handle edupirfintech.sberbank.ru:9443 has not been defined.</H3><BR>
                    <-- 404 FROM GET https://edupirfintech.sberbank.ru:9443/v1/partner-info/advance-acceptances?clientId=111286&date=2021-10-28
                    ```

                    To see it, add `SBBOL_DEBUG` environment variable

                    Example response from SBBOL API at Swagger:
                    At this stage response can be following:
                    ```json
                    {
                      "cause": "DATA_NOT_FOUND_EXCEPTION",
                      "referenceId": "91c03a40-637e-4589-b4fe-9b77463aeca3",
                      "message": "Не найдено ни одного заранее данного акцепта за указанную дату"
                    }
                    ```
                 */
                sbbolSubscribersInfo.advanceAcceptances.on('data', data => {
                    console.log('Reading `advanceAcceptances` response')
                    console.debug(data)
                })
                sbbolSubscribersInfo.packageOfServices.on('data', data => {
                    console.log('Reading `packageOfServices` response')
                    console.debug(data)
                })
            }

            /*
                Following algorithm is to be implemented:
                ```
                if active `ServiceSubscription` is not present in condo
                    fetch signed offers from SBBOL API
                    if offer from SBBOL is signed by client
                       create `ServiceSubscription`
                    else
                        put new offer (for our subscription) to SBBOL API
                        redirect to offer sign page
                        if callback for signing offer is technically available (likely they don't have it)
                            wait for callback with signing of offer
                                create `ServiceSubscription`
                        else
                            poll SBBOL API
                                fetch signed offers from SBBOL API
                                if signed offer is present
                                    create `ServiceSubscription`
                ```
             */

            return res.redirect('/')
        } catch (error) {
            return next(error)
        }
    }
}

module.exports = {
    SbbolRoutes,
}
