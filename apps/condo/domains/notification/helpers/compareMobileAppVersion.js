function compareMobileAppVersions (lhs, rhs) {
    const digitRegex = /\d+/g
    const digitsArrayOfLhs = lhs.match(digitRegex)
    const digitsArrayOfRhs = rhs.match(digitRegex)

    // Comparing the main versions
    for (let i = 0; i < Math.min(digitsArrayOfLhs.length, digitsArrayOfRhs.length); i++) {
        if (digitsArrayOfLhs[i] < digitsArrayOfRhs[i]) {
            return -1
        } else if (digitsArrayOfLhs[i] > digitsArrayOfRhs[i]) {
            return 1
        }
    }

    // If the major versions are the same, compare the build numbers (if any)
    if (digitsArrayOfLhs.length < digitsArrayOfRhs.length) {
        return -1
    } else if (digitsArrayOfLhs.length > digitsArrayOfRhs.length) {
        return 1
    }

    // Versions are the same
    return 0
}

module.exports = {
    compareMobileAppVersions,
}