function compareMobileAppVersions (ver1, ver2) {
    // Splitting strings into arrays of numbers
    const ver1_nums = ver1.split('(')[0].split('.').map(Number)
    const ver2_nums = ver2.split('(')[0].split('.').map(Number)

    // Comparing the main versions
    for (let i = 0; i < Math.min(ver1_nums.length, ver2_nums.length); i++) {
        if (ver1_nums[i] < ver2_nums[i]) {
            return -1
        } else if (ver1_nums[i] > ver2_nums[i]) {
            return 1
        }
    }

    // If the major versions are the same, compare the build numbers (if any)
    if (ver1_nums.length < ver2_nums.length) {
        return -1
    } else if (ver1_nums.length > ver2_nums.length) {
        return 1
    }

    // If the build numbers also match, compare the release numbers (in parentheses)
    const buildVer1 = parseInt(ver1.split('(')[1])
    const buildVer2 = parseInt(ver2.split('(')[1])
    if (!isNaN(buildVer1) && !isNaN(buildVer2)) {
        if (buildVer1 < buildVer2) {
            return -1
        } else if (buildVer1 > buildVer2) {
            return 1
        }
    }

    // Versions are the same
    return 0
}

module.exports = {
    compareMobileAppVersions,
}