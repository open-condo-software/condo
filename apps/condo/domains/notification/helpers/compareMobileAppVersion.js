function compareMobileAppVersions (ver1, ver2) {
    const digitRegex = /\d+/g
    const digitsArrayOfVer1 = ver1.match(digitRegex)
    const digitsArrayOfVer2 = ver2.match(digitRegex)

    // Comparing the main versions
    for (let i = 0; i < Math.min(digitsArrayOfVer1.length, digitsArrayOfVer2.length); i++) {
        if (digitsArrayOfVer1[i] < digitsArrayOfVer2[i]) {
            return -1
        } else if (digitsArrayOfVer1[i] > digitsArrayOfVer2[i]) {
            return 1
        }
    }

    // If the major versions are the same, compare the build numbers (if any)
    if (digitsArrayOfVer1.length < digitsArrayOfVer2.length) {
        return -1
    } else if (digitsArrayOfVer1.length > digitsArrayOfVer2.length) {
        return 1
    }

    // Versions are the same
    return 0
}

module.exports = {
    compareMobileAppVersions,
}