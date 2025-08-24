const { z } = require('zod')

const GITHUB_STRATEGY_CONFIG_SCHEMA = z.object({
    clientID: z.string(),
    clientSecret: z.string(),
}).strict()

const CONDO_USER_FIELDS = [
    'id',
    'name',
    'phone',
    'isPhoneVerified',
    'email',
    'isEmailVerified',
]

const fieldMappingSchema = z.object(
    Object.fromEntries(CONDO_USER_FIELDS.map(field => [field, z.string().optional()]))
).strict()

const OIDC_TOKEN_VERIFICATION_CONFIG_SCHEMA = z.object({
    clients: z.record(z.string(), z.object({
        // Condo-related part
        fieldMapping: fieldMappingSchema.optional(),
        identityType: z.string(),
        trustEmail: z.boolean().optional().default(false),
        trustPhone: z.boolean().optional().default(false),
        requireConfirmPhoneAction: z.boolean().optional().default(true),
        requireConfirmEmailAction: z.boolean().optional().default(true),
        // Strategy-related part
        userInfoURL: z.string(),
    })),
}).strict()

const OIDC_STRATEGY_CONFIG_SCHEMA = z.object({
    // Condo-related part
    identityType: z.string().optional(),
    fieldMapping: fieldMappingSchema.optional(),
    // Strategy-related part
    issuer: z.string(),
    scope: z.string().optional().default('openid'),
    authorizationURL: z.url(),
    tokenURL: z.url(),
    userInfoURL: z.url(),
    clientID: z.string(),
    clientSecret: z.string(),
}).strict()

const AUTH_STRATEGIES_CONFIG = {
    github: { optionsSchema: GITHUB_STRATEGY_CONFIG_SCHEMA, trustEmail: true },
    oidcTokenUserInfo: { optionsSchema: OIDC_TOKEN_VERIFICATION_CONFIG_SCHEMA },
    oidc: { optionsSchema: OIDC_STRATEGY_CONFIG_SCHEMA },
}

const BASE_CONFIG_SCHEMA = z.object({
    name: z.string(),
    strategy: z.enum(Object.keys(AUTH_STRATEGIES_CONFIG)),
}).strict()

const UNITED_PROVIDER_SCHEMA = z.discriminatedUnion('strategy', Object.entries(AUTH_STRATEGIES_CONFIG)
    .map(([strategy, { optionsSchema, trustEmail, trustPhone }]) =>
        BASE_CONFIG_SCHEMA.extend({
            strategy: z.literal(strategy),
            options: optionsSchema,
            trustEmail: z.boolean().optional().default(!!trustEmail),
            trustPhone: z.boolean().optional().default(!!trustPhone),
        })
    )
)

const passportConfigSchema = z.array(UNITED_PROVIDER_SCHEMA)




module.exports = {
    fieldMappingSchema,
    passportConfigSchema,
}