const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { userExternalIdentityUserFormCallback } = require('@condo/domains/user/utils/serverSchema')

const USER_EXTERNAL_ID_CONFIG = process.env.USER_EXTERNAL_ID_CONFIG ? JSON.parse(process.env.USER_EXTERNAL_ID_CONFIG) : {}

const {
    ioLoginFormDeepLink,
    androidLoginFormDeepLink,
} = USER_EXTERNAL_ID_CONFIG

class UserExternalIdentityRoute {
    async init () {
        const { keystone: context } = await getSchemaCtx('UserExternalIdentity')
        this.context = context
    }

    isAndroidAgent (userAgent) {
        return (
            typeof userAgent !== 'undefined'
            && /Android/i.test(userAgent)
        )
    }

    isIOSAgent (userAgent) {
        return (
            typeof userAgent !== 'undefined'
            && /iPhone|iPad|iPod/i.test(userAgent)
        )
    }

    getLoginPageRedirectBasePath (userAgent) {
        if (this.isAndroidAgent(userAgent)) {
            return androidLoginFormDeepLink
        } else if (this.isIOSAgent(userAgent)) {
            return ioLoginFormDeepLink
        } else {
            throw new Error('Not supported browser')
        }
    }

    async handleRequest (req, res) {
        const { type: identityType } = req.params
        const params = req.query

        try {
            const { registered, tokenSet } = await userExternalIdentityUserFormCallback(this.context, {
                identityType,
                params,
            })

            // redirect user to mobile app page with handling of:
            // 1. register user case
            // 2. exists user login case
            const basePath = this.getLoginPageRedirectBasePath(req.get('user-agent'))
            const redirectLink = `${basePath}?registered=${registered}&params=${JSON.stringify(tokenSet)}&identityType=${identityType}`
            return res.redirect(redirectLink)
        } catch (e) {
            return res.redirect('/500-error.html')
        }
    }
}

module.exports = {
    UserExternalIdentityRoute,
}