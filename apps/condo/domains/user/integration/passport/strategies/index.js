const { GithubAuthStrategy } = require('./github')
const { OIDCAuthStrategy } = require('./oidc')
const { OidcTokenUserInfoAuthStrategy } = require('./oidcTokenUserInfo')

const KNOWN_STRATEGIES = {
    github: GithubAuthStrategy,
    oidc: OIDCAuthStrategy,
    oidcTokenUserInfo: OidcTokenUserInfoAuthStrategy,
}

module.exports = {
    GithubAuthStrategy,
    KNOWN_STRATEGIES,
}