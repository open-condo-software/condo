const { GithubAuthStrategy } = require('./github')

const KNOWN_STRATEGIES = {
    github: GithubAuthStrategy,
}

module.exports = {
    GithubAuthStrategy,
    KNOWN_STRATEGIES,
}