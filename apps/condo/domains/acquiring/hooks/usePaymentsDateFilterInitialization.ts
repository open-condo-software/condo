import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

import { VIEW_TYPES, ViewTypes } from '@condo/domains/acquiring/utils/clientSchema'
import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'


const getDefaultDateFilter = (): string[] => [
    dayjs().subtract(1, 'week').toISOString(),
    dayjs().toISOString(),
]

export const usePaymentsDateFilterInitialization = (
    isPaymentsRouteReady: boolean,
    type: ViewTypes
): boolean => {
    const router = useRouter()
    const [isInitialized, setIsInitialized] = useState(false)
    const isInitializationInProgressRef = useRef(false)

    useEffect(() => {
        if (!isPaymentsRouteReady) {
            isInitializationInProgressRef.current = false
            setIsInitialized(false)
            return
        }

        if (isInitialized || isInitializationInProgressRef.current) return

        isInitializationInProgressRef.current = true
        const { filters } = parseQuery(router.query)
        const dateFilterKey = type === VIEW_TYPES.registry ? 'paymentPeriod' : 'depositedDate'
        const dateFilter = filters[dateFilterKey]

        const initialize = async (): Promise<void> => {
            if (!Array.isArray(dateFilter) || dateFilter.length !== 2) {
                await updateQuery(
                    router,
                    {
                        newParameters: {
                            ...getFiltersQueryData({
                                ...filters,
                                [dateFilterKey]: getDefaultDateFilter(),
                            }),
                            tab: 'payments',
                            type,
                        },
                    },
                    { resetOldParameters: false, routerAction: 'replace', shallow: true }
                )
            }

            setIsInitialized(true)
            isInitializationInProgressRef.current = false
        }

        void initialize()
    }, [isInitialized, isPaymentsRouteReady, router, type])

    return isInitialized
}
