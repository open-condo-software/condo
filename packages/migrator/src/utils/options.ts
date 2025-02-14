export type CommonOptions = {
    yes: boolean
    filter?: Array<string>
}

export const YES_OPTION = [
    '-y, --yes',
    'Skips confirmation prompts and assume "yes" as the default answer. Use it if you\'re sure what you\'re doing or using a non-input environment (CI / Dockerfile, etc.)',
    false,
] as const

export const FILTER_OPTION = [
    '-f, --filter <names...>',
    'Filters apps by names, name can be full ("@app/condo") or only non-scoped ("condo")',
] as const