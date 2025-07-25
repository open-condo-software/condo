const { GithubAuthStrategy } = require('./github')
const { OIDCAuthStrategy } = require('./oidc')

const KNOWN_STRATEGIES = {
    github: GithubAuthStrategy,
    oidc: OIDCAuthStrategy,
}

module.exports = {
    GithubAuthStrategy,
    KNOWN_STRATEGIES,
}