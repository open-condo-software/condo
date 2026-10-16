/**
 * NOTE: Partially sourced from https://github.com/npm/validate-npm-package-name/blob/main/lib/index.js
 */

const scopedPackagePattern = new RegExp('^(?:@([^/]+?)[/])?([^/]+?)$')
const exclusionList = [
    'node_modules',
    'favicon.ico',
]

type ValidationResult = {
    validForNewPackages: boolean
    validForOldPackages: boolean
    warnings?: string[]
    errors?: string[]
}

function done (warnings: string[], errors: string[]): ValidationResult {
    const result: ValidationResult = {
        validForNewPackages: errors.length === 0 && warnings.length === 0,
        validForOldPackages: errors.length === 0,
        warnings: warnings,
        errors: errors,
    }
    if (!result.warnings?.length) {
        delete result.warnings
    }
    if (!result.errors?.length) {
        delete result.errors
    }
    return result
}

export function validate (name: unknown): ValidationResult {
    const warnings: string[] = []
    const errors: string[] = []

    if (name === null) {
        errors.push('name cannot be null')
        return done(warnings, errors)
    }

    if (name === undefined) {
        errors.push('name cannot be undefined')
        return done(warnings, errors)
    }

    if (typeof name !== 'string') {
        errors.push('name must be a string')
        return done(warnings, errors)
    }

    if (!name.length) {
        errors.push('name length must be greater than zero')
    }

    if (name.startsWith('.')) {
        errors.push('name cannot start with a period')
    }

    if (name.startsWith('-')) {
        errors.push('name cannot start with a hyphen')
    }

    if (name.match(/^_/)) {
        errors.push('name cannot start with an underscore')
    }

    if (name.trim() !== name) {
        errors.push('name cannot contain leading or trailing spaces')
    }

    // No funny business
    exclusionList.forEach(function (excludedName) {
        if (name.toLowerCase() === excludedName) {
            errors.push(excludedName + ' is not a valid package name')
        }
    })

    // Generate warnings for stuff that used to be allowed

    if (name.length > 214) {
        warnings.push('name can no longer contain more than 214 characters')
    }

    // mIxeD CaSe nAMEs
    if (name.toLowerCase() !== name) {
        warnings.push('name can no longer contain capital letters')
    }

    if (/[~'!()*]/.test(name.split('/').slice(-1)[0])) {
        warnings.push('name can no longer contain special characters ("~\'!()*")')
    }

    if (encodeURIComponent(name) !== name) {
        // Maybe it's a scoped package name, like @user/package
        const nameMatch = name.match(scopedPackagePattern)
        if (nameMatch) {
            const user = nameMatch[1]
            const pkg = nameMatch[2]

            if (pkg.startsWith('.')) {
                errors.push('name cannot start with a period')
            }

            if (encodeURIComponent(user) === user && encodeURIComponent(pkg) === pkg) {
                return done(warnings, errors)
            }
        }

        errors.push('name can only contain URL-friendly characters')
    }

    return done(warnings, errors)
}