const Ajv = require('ajv')
const { omit, get, capitalize } = require('lodash')
const passport = require('passport')
const { Strategy: CustomStrategy } = require('passport-custom')
const { Strategy: GithubStrategy } = require('passport-github2')
const { Strategy: OIDCStrategy } = require('passport-openidconnect')

const conf = require('@open-condo/config')

const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')
const {
    User,
    UserExternalIdentity,
} = require('@condo/domains/user/utils/serverSchema')

const VALID_USER_TYPES = [RESIDENT, STAFF]
const DV_AND_SENDER = {
    dv: 1,
    sender: { dv: 1, fingerprint: 'user-external-identity-middleware' },
}
const USER_PROFILE_MAPPING = {
    id: 'id',
    name: 'name',
    phone: 'phone',
    email: 'email',
    isPhoneVerified: 'isPhoneVerified',
    isEmailVerified: 'isEmailVerified',
}
const ajv = new Ajv()
const oidcConfigSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            authorizationURL: { type: 'string' },
            tokenURL: { type: 'string' },
            userInfoURL: { type: 'string' },
            clientID: { type: 'string' },
            clientSecret: { type: 'string' },
            callbackURL: { type: 'string' },
            name: { type: 'string' },
            isPhoneTrusted: { type: 'boolean' },
            isEmailTrusted: { type: 'boolean' },
            issuer: { type: 'string' },
            scope: { type: 'string' },
            fieldMapping: { type: 'object' },
        },
        additionalProperties: false,
        required: [
            'authorizationURL',
            'tokenURL',
            'userInfoURL',
            'clientID',
            'clientSecret',
            'callbackURL',
            'name',
            'isPhoneTrusted',
            'isEmailTrusted',
            'issuer',
            'scope',
        ],

    },
}
const githubConfigSchema = {
    'type': 'object',
    'properties': {
        'clientId': { 'type': 'string' },
        'clientSecret': { 'type': 'string' },
        'callbackUrl': { 'type': 'string' },
        'name': { 'type': 'string' },
        'isEmailTrusted': { 'type': 'boolean' },
    },
    additionalProperties: false,
    'required': [
        'clientId',
        'clientSecret',
        'callbackUrl',
        'name',
        'isEmailTrusted',
    ],

}
const sdkConfigSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            name: { type: 'string' },
            isPhoneTrusted: { type: 'boolean' },
            isEmailTrusted: { type: 'boolean' },
            userInfoURL: { type: 'string' },
            fieldMapping: { type: 'object' },
        },
        additionalProperties: false,
        required: [
            'name',
            'isPhoneTrusted',
            'isEmailTrusted',
            'userInfoURL',
        ],
    },
}


/**
 * Retrieves configuration flags for trusted contact methods.
 * @param {object} config - The configuration object.
 * @returns {{isPhoneTrusted: boolean, isEmailTrusted: boolean}}
 */
const getTrustedConfig = (config) => ({
    isPhoneTrusted: get(config, 'isPhoneTrusted', false),
    isEmailTrusted: get(config, 'isEmailTrusted', false),
})

/**
 * Finds an existing user based on a verified contact method (phone or email).
 * @param {object} context - The Keystone context.
 * @param {object} searchCriteria - The base criteria for the user search.
 * @param {string} contactInfo - The phone number or email address.
 * @param {string} contactType - 'phone' or 'email'.
 * @returns {Promise<object|null>} The existing user or null.
 */
const findExistingUserByVerifiedContact = async (context, searchCriteria, contactInfo, contactType) => {
    const query = {
        ...searchCriteria,
        [contactType]: contactInfo,
        [`is${contactType.charAt(0).toUpperCase() + contactType.slice(1)}Verified`]: true,
    }
    return User.getOne(context, query)
}

/**
 * Creates a new user with the specified details.
 * @param {object} context - The Keystone context.
 * @param {object} baseUserData - The base data for creating a new user.
 * @param {string|null} contactInfo - The phone number or email address. Could be null in case of user will be created from untrusted source
 * @param {string} contactType - 'phone' or 'email'.
 * @param {boolean} isVerified - Whether the contact method is verified.
 * @returns {Promise<object>} The newly created user.
 */
const createNewUser = async (context, baseUserData, contactInfo, contactType, isVerified) => {
    const userData = {
        ...baseUserData,
        [contactType]: contactInfo,
        [`is${contactType.charAt(0).toUpperCase() + contactType.slice(1)}Verified`]: isVerified,
    }
    return User.create(context, userData)
}

/**
 * Handles the logic for finding or creating a user based on contact information.
 * @param {object} context - The Keystone context.
 * @param {object} userProfile - The user's profile data.
 * @param {object} searchCriteria - The base criteria for user searches.
 * @param {object} baseUserData - The base data for creating a new user.
 * @param {boolean} isTrusted - Whether the contact method is trusted.
 * @param {string} contactType - 'phone' or 'email'.
 * @returns {Promise<object>} The found or created user.
 */
const findOrCreateUserByContact = async (context, userProfile, searchCriteria, baseUserData, isTrusted, contactType) => {
    let contactInfo = userProfile[contactType]
    if (!contactInfo) return null

    contactInfo = contactType === 'phone'
        ? normalizePhone(contactInfo)
        : normalizeEmail(contactInfo)

    if (isTrusted) {
        const existingUser = await findExistingUserByVerifiedContact(context, searchCriteria, contactInfo, contactType)
        if (existingUser) return existingUser

        /** Partner server can provide isEmailVerified or isPhoneVerified as well
         *  We can set isEmailVerified or isPhoneVerified based on these values only
         *  if current provider marked as trusted */

        const partnerVerification = get(userProfile, `is${capitalize(contactType)}Verified`, true)
        return createNewUser(context, baseUserData, contactInfo, contactType, partnerVerification)
    }

    // For untrusted contacts, we don't search for an existing user and always create a new one.
    return createNewUser(context, baseUserData, null, contactType, false)
}

/**
 * Gets or creates a user and their external identity.
 *
 * This function first attempts to find a user's external identity.
 * If found, it returns the associated user.
 * If not found, it proceeds to find an existing user by their verified and trusted
 * phone number or email. If no existing user is found, a new user is created.
 * Finally, it creates the external identity and links it to the user.
 * @param {object} keystone - keystone instance object
 * @param {object} userProfile - The profile of the user from the external provider.
 * @param {string} userType - The type of the user (e.g., 'customer', 'driver').
 * @param {string} identityType - The identity provider (e.g., 'github', 'custom-oidc').
 * @param {object} config - Configuration options.
 * @param {object} fieldMapping - userInfo json remap options. For example { id: 'sub' } converts oidc default "sub" field "id"
 * @returns {Promise<object>} The resolved user object.
 */
async function getOrCreateUser (keystone, userProfile, userType, identityType, config, fieldMapping = {}) {
    const context = await keystone.createContext({ skipAccessControl: true })
    // Remap fields of user profile
    const finalMapping = { ...USER_PROFILE_MAPPING, ...fieldMapping }
    const mappedProfile = {
        id: String(get(userProfile, finalMapping.id)),
        name: get(userProfile, finalMapping.name, null),
        phone: get(userProfile, finalMapping.phone, null),
        email: get(userProfile, finalMapping.email, null),
        isPhoneVerified: get(userProfile, finalMapping.isPhoneVerified, true),
        isEmailVerified: get(userProfile, finalMapping.isEmailVerified, true),
    }

    // 1. Check for an existing external identity
    const userExternalIdentity = await UserExternalIdentity.getOne(context, {
        identityId: mappedProfile.id,
        userType,
        identityType,
        deletedAt: null,
    }, 'user { id }')

    if (userExternalIdentity) {
        return userExternalIdentity.user
    }

    // 2. If no external identity, find or create the user
    const { isPhoneTrusted, isEmailTrusted } = getTrustedConfig(config)

    const userMeta = { ...mappedProfile, provider: identityType }
    const existingUserSearch = { deletedAt: null, type: userType, isAdmin: false, isSupport: false }
    const baseUserData = {
        ...omit(existingUserSearch, 'deletedAt'),
        isPhoneVerified: false,
        isEmailVerified: false,
        meta: userMeta,
        name: mappedProfile.name,
        ...DV_AND_SENDER,
    }

    let user = await findOrCreateUserByContact(context, mappedProfile, existingUserSearch, baseUserData, isPhoneTrusted, 'phone')

    if (!user) {
        user = await findOrCreateUserByContact(context, mappedProfile, existingUserSearch, baseUserData, isEmailTrusted, 'email')
    }

    if (!user) {
        user = await User.create(context, baseUserData)
    }

    // 3. Create the external identity and link it to the user
    await UserExternalIdentity.create(context, {
        identityId: mappedProfile.id,
        user: { connect: { id: user.id } },
        identityType,
        userType,
        meta: userMeta,
        ...DV_AND_SENDER,
    })

    return user
}

function addPassportHandlers (app, keystone) {

    app.use(passport.initialize())

    const captureUserType = (useSession) => async (req, res, next) => {
        const { userType } = req.query

        if (!userType) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'The userType query parameter is required.',
            })
        }

        if (!VALID_USER_TYPES.includes(userType)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: `Valid user types are ${VALID_USER_TYPES.join(', ')}`,
            })
        }

        // We don't want to use session store when it's not a oath/oidc like authorization because it's single request and context will not be lost during redirects
        if (useSession) {
            req.session.userType = userType
        } else {
            req.userType = userType
        }
        next()
    }

    const onAuthSuccess = ({ provider, authMethod }) => async (req, res) => {
        const user = req.user

        if (!user) {
            return res.status(401).json({ error: 'Authentication failed', message: 'User not found after authentication' })
        }

        try {
            // set authorization cookie
            await keystone._sessionManager.startAuthedSession(req, {
                item: { id: user.id },
                list: keystone.lists['User'],
                sessionInfo: { provider, authMethod },
            })

            return res.redirect('/')
        } catch (e) {
            return res.status(500).json({ error: 'Session creation failure', message: 'Could not start authed session for provided user' })
        }
    }

    if (conf['PASSPORT_OIDC']) {
        const oidcConfig = JSON.parse(conf['PASSPORT_OIDC'])
        const validateConfig = ajv.compile(oidcConfigSchema)
        const configValid = validateConfig(oidcConfig)
        if (!configValid) {
            throw new Error(`OIDC config validation failed ${ajv.errorsText(validateConfig.errors)}`)
        }

        oidcConfig.forEach(config => {
            const fieldMapping = config.fieldMapping || {}
            const strategy = {
                issuer: config.issuer,
                authorizationURL: config.authorizationURL,
                tokenURL: config.tokenURL,
                userInfoURL: config.userInfoURL,
                clientID: `${config.clientID}`,
                clientSecret: config.clientSecret,
                callbackURL: config.callbackURL,
                scope: config.scope,
                passReqToCallback: true,
            }

            passport.use(config.name, new OIDCStrategy(
                strategy,
                async (req, issuer, uiProfile, idProfile, context, idToken, accessToken, refreshToken, params, done) => {
                    const profile = uiProfile._json
                    const userType = req.userType || req.session.userType

                    try {
                        const user = await getOrCreateUser(
                            keystone, profile,
                            userType, config.name,
                            config, fieldMapping
                        )

                        return done(null, user)
                    } catch (error) {
                        done(error)
                    }
                }
            ))

            app.get(`/api/auth/${config.name}`, captureUserType(true), passport.authenticate(config.name, { session: false }))
            app.get(
                `/api/auth/${config.name}/callback`,
                passport.authenticate(config.name, { session: false, failureRedirect: '/?error=openid_fail' }),
                onAuthSuccess({ provider: config.name, authMethod: `/api/auth/${config.name}` })
            )
        })
    }

    if (conf['PASSPORT_GITHUB']) {
        const githubConfig = JSON.parse(conf['PASSPORT_GITHUB'])
        const validateConfig = ajv.compile(githubConfigSchema)
        const configValid = validateConfig(githubConfig)
        if (!configValid) {
            throw new Error(`Github config validation failed ${ajv.errorsText(validateConfig.errors)}`)
        }

        passport.use(new GithubStrategy({
            clientID: githubConfig.clientId,
            clientSecret: githubConfig.clientSecret,
            callbackURL: githubConfig.callbackUrl,
            scope: ['user:email'],
            // This enables ability to pass request arguments from user input. We need to receive userType
            passReqToCallback: true,
        }, async (req, accessToken, refreshToken, profile, done) => {
            const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null
            if (!email) {
                return done(new Error('Github email address required'))
            }
            const userType = req.userType || req.session.userType

            try {
                const user = await getOrCreateUser(
                    keystone,
                    { id: profile.id, email },
                    userType,
                    'github',
                    githubConfig,
                )

                return done(null, user)
            } catch (error) {
                done(error)
            }
        }))

        app.get('/api/auth/github', captureUserType(true), passport.authenticate('github', { scope: [ 'user:email' ], session: false }))
        app.get('/api/auth/github/callback', passport.authenticate('github', { session: false, failureRedirect: '/?error=github_fail' }), onAuthSuccess({ provider: 'github', authMethod: '/api/auth/github' }))
    }

    if (conf['PASSPORT_SDK']) {
        const sdkConfig = JSON.parse(conf['PASSPORT_SDK'])
        const validateConfig = ajv.compile(sdkConfigSchema)
        const configValid = validateConfig(sdkConfig)
        if (!configValid) {
            throw new Error(`SDK config validation failed ${ajv.errorsText(validateConfig.errors)}`)
        }

        passport.use('sdk', new CustomStrategy(async (req, done) => {
            const { provider } = req.query
            if (!provider) {
                const error = new Error('Provider parameter is required')
                error.statusCode = 400
                error.errorCode = 'Missing provider query parameter'
                return done(error)
            }

            const config = sdkConfig.find(c => c.name === provider)
            if (!config) {
                const error = new Error('Wrong provider value')
                error.statusCode = 400
                error.errorCode = `${provider} is not registered as auth method`
                return done(error)
            }

            const fieldMapping = config.fieldMapping || {}
            try {
                const userType = req.userType || req.session.userType
                const { 'access-token': accessToken } = req.query
                if (!accessToken) {
                    const error = new Error('Query parameter access-token is required')
                    error.statusCode = 403
                    error.errorCode = 'Missing access token'
                    return done(error)
                }

                const profileResponse = await fetch(config.userInfoURL, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })

                if (!profileResponse.ok) {
                    const error = new Error(`Failed to fetch user profile: ${profileResponse.statusText}`)
                    error.statusCode = 400
                    error.errorCode = 'User profile response not ok'
                    return done(error)
                }

                const userProfile = await profileResponse.json()
                if (!Object.keys(userProfile).length) {
                    const error = new Error('User profile returned empty object')
                    error.statusCode = 400
                    error.errorCode = 'User profile empty response'
                    return done(error)
                }

                const user = await getOrCreateUser(
                    keystone, userProfile, userType, config.name,
                    config, fieldMapping
                )

                return done(null, user)
            } catch (error) {
                done(error)
            }
        }))

        app.get(
            '/api/auth/sdk',
            captureUserType(false),
            passport.authenticate('sdk'),
            onAuthSuccess({ provider: 'sdk', authMethod: '/api/auth/sdk' }),
            (err, req, res, next) => {
                const statusCode = err.statusCode || 500
                const errorCode = err.errorCode || 'Internal server error'
                return res.status(statusCode).json({
                    error: errorCode,
                    message: err.message,
                })
            }
        )
    }

    passport.serializeUser((user, done) => {
        done(null, user.id)
    })

    passport.deserializeUser(async (id, done) => {
        const context = await keystone.createContext({ skipAccessControl: true })
        const user = await User.getOne(context, { id })
        done(null, user)
    })
}

module.exports = { addPassportHandlers }
