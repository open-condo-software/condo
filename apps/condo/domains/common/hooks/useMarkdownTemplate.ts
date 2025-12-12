import { useMemo } from 'react'

import { interpolate } from '@condo/domains/common/utils/string.utils'

export function useMarkdownTemplate (template: string, values: Record<string, any>) {
    return useMemo(() => interpolate(template, values), [template, values])
}