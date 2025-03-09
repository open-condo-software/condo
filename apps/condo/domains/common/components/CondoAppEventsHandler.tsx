import { useEffect } from 'react'

import { analytics } from '@condo/domains/common/utils/analytics'

import type { FC } from 'react'



export const CondoAppEventsHandler: FC = () => {
    useEffect(() => {
        // analytics.identify('12345', { name: 'Test', type: 'staff' })
    }, [])

    return null
}