import { validate } from './validate'

type ValidateNpmNameResult = {
    valid: true
} | {
    valid: false
    problems: string[]
}

export function validateNpmName (name: string): ValidateNpmNameResult {
    const result = validate(name)
    if (result.validForNewPackages) {
        return { valid: true }
    }

    return {
        valid: false,
        problems: [
            ...(result.errors || []),
            ...(result.warnings || []),
        ],
    }
}
