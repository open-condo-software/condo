const { z } = require('zod')

const { getGQLErrorValidator } = require('@condo/domains/common/schema/json.utils')

const VALID_PROTOCOLS = ['https', 'http']
const SUB_DOMAIN_REGEXP = /^[a-z0-9-]{1,63}$/i
const PARAMETER_REGEXP = /^:[a-z_][a-z0-9_]*[*+?]?$/i
const PATH_NAME_PART_REGEXP = /^([a-z0-9-_]|%[0-9a-f]{2})+$/i
const FILE_NAME_REGEXP = /^([a-z0-9-_]|%[0-9a-f]{2})+\.[a-z]+$/i
const PORT_REGEXP = /^\d{1,5}$/i

function _validateHostName (hostname) {
    const parts = hostname.split('.')
    for (const part of parts) {
        const isExact = SUB_DOMAIN_REGEXP.test(part)
        const isParameter = PARAMETER_REGEXP.test(part)
        if (!isExact && !isParameter) {
            throw new Error('Only exact subdomains and parametrized subdomains are allowed!')
        }
        if (isParameter && (part.endsWith('*') || part.endsWith('+') || part.endsWith('?'))) {
            throw new Error('Parametrized subdomains are not allowed to have * or + or ?')
        }
    }
}

function _validatePathname (pathname) {
    if (!pathname.startsWith('/')) throw new Error('pathname must start with /')
    if (pathname === '/') return

    const sliceEnd = pathname.endsWith('/') ? pathname.length - 1 : pathname.length
    const parts = pathname.slice(1, sliceEnd).split('/')

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const isExactPart = PATH_NAME_PART_REGEXP.test(part)
        const isParameter = PARAMETER_REGEXP.test(part)
        const isFileName = FILE_NAME_REGEXP.test(part)
        if (!isParameter && !isFileName && !isExactPart) throw new Error('Only exact or parametrized paths are allowed!')
        if (isFileName && i !== parts.length - 1) throw new Error('File names are not allowed in the middle of the path')
    }
}

function validatePattern (strPattern) {
    const pattern = new URLPattern(strPattern)
    if (pattern.hash !== '*' || pattern.search !== '*') throw new Error('Patterns with hash or search are unsupported!')
    if (!VALID_PROTOCOLS.includes(pattern.protocol)) throw new Error(`Only ${VALID_PROTOCOLS.join(', ')} protocols are allowed`)
    if (pattern.port && !PORT_REGEXP.test(pattern.port)) throw new Error('Port patterns are unsupported')
    if (pattern.username !== '*' || pattern.password  !== '*') throw new Error('Patterns with username or password are unsupported')
    _validateHostName(pattern.hostname)
    _validatePathname(pattern.pathname)
}

const EXTERNAL_LINKS_FIELD = {
    schemaDoc:
        'List of URLs or URLPatterns, ' +
        'containing external links that miniapp can open (via iframe or just regular links) during its work. ' +
        'Used by native clients to control user navigation',
    type: 'Json',
    graphQLReturnType: '[String!]',
    graphQLInputType: '[String!]',
    isRequired: true,
    defaultValue: [],
    hooks: {
        validateInput: getGQLErrorValidator(z.array(z.string().superRefine((val, ctx) => {
            try {
                validatePattern(val)
            } catch (err) {
                ctx.addIssue({
                    code: 'invalid_element',
                    message: err.message,
                })
            }
        }) ), 'INVALID_MINIAPP_EXTERNAL_LINKS'),
    },
}

module.exports = {
    EXTERNAL_LINKS_FIELD,
}