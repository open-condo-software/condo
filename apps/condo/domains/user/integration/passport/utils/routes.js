const { authGuards } = require('@condo/domains/user/utils/serverSchema/auth')

async function checkAuthRateLimits (req, res, next) {
    try {
        const context = { req, authedItem: req.user }
        await authGuards({ userType: req.session.userType }, context)
        next()
    } catch (err) {
        next(err)
    }
}

module.exports = {
    checkAuthRateLimits,
}