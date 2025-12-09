import { interpolate } from '@condo/domains/common/utils/string.utils'

export function useMarkdownTemplate (template: string, values: Record<string, any>) {
    return interpolate(template, values)
}