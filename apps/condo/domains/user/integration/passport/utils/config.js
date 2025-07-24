const { z } = require('zod')

const GITHUB_STRATEGY_CONFIG_SCHEMA = z.object({
    clientID: z.string(),
    clientSecret: z.string(),
}).strict()

const USER_INFO_FIELDS = [
    'sub',
    'name',
    'phone_number',
    'phone_number_verified',
    'email',
    'email_verified',
]

const OIDC_MAPPING_SCHEMA = z.object(
    Object.fromEntries(USER_INFO_FIELDS.map(field => [field, z.string().optional()]))
).strict()

const OIDC_TOKEN_VERIFICATION_CONFIG_SCHEMA = z.object({
    clients: z.record(z.string(), z.object({
        trustEmail: z.boolean().optional().default(false),
        trustPhone: z.boolean().optional().default(false),
        userInfoURL: z.string(),
        fieldMapping: OIDC_MAPPING_SCHEMA.optional(),
    })),
}).strict()

const OIDC_STRATEGY_CONFIG_SCHEMA = z.object({
    issuer: z.string(),
    authorizationURL: z.string().url(),
    tokenURL: z.string().url(),
    userInfoURL: z.string().url(),
    clientId: z.string(),
    clientSecret: z.string(),
    callbackURL: z.string().url(),
}).strict()

const AUTH_STRATEGIES_CONFIG = {
    github: { optionsSchema: GITHUB_STRATEGY_CONFIG_SCHEMA, trustEmail: true },
    oidcToken: { optionsSchema: OIDC_TOKEN_VERIFICATION_CONFIG_SCHEMA },
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
    passportConfigSchema,
}