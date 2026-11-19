import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

import { VIEW_TYPES, ViewTypes } from '@condo/domains/acquiring/utils/clientSchema'
import { getDefaultPaymentSort } from '@condo/domains/acquiring/utils/paymentFilters'
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
    const initializationIdRef = useRef(0)

    useEffect(() => {
        const initializationId = ++initializationIdRef.current

        if (!isPaymentsRouteReady) {
            isInitializationInProgressRef.current = false
            return
        }

        if (isInitialized || isInitializationInProgressRef.current) return

        isInitializationInProgressRef.current = true
        const { filters } = parseQuery(router.query)
        const dateFilterKey = type === VIEW_TYPES.registry ? 'paymentPeriod' : 'depositedDate'
        const dateFilter = filters[dateFilterKey]
        const hasValidDateFilter = Array.isArray(dateFilter)
            && dateFilter.length === 2
            && dateFilter.every(date => dayjs(date).isValid())
        const hasNonDateFilter = Object.entries(filters).some(([key, value]) => {
            if (key === dateFilterKey) return false
            if (Array.isArray(value)) return value.length > 0

            return Boolean(value)
        })
        const sort = Array.isArray(router.query.sort) ? router.query.sort[0] : router.query.sort
        const shouldInitializeDateFilter = !hasValidDateFilter && !hasNonDateFilter
        const shouldInitializeSort = !sort

        const initialize = async (): Promise<void> => {
            try {
                if (shouldInitializeDateFilter || shouldInitializeSort) {
                    await updateQuery(
                        router,
                        {
                            newParameters: {
                                ...getFiltersQueryData({
                                    ...filters,
                                    ...(shouldInitializeDateFilter ? { [dateFilterKey]: getDefaultDateFilter() } : {}),
                                }),
                                sort: sort || getDefaultPaymentSort(type),
                                tab: 'payments',
                                type,
                            },
                        },
                        { resetOldParameters: false, routerAction: 'replace', shallow: true }
                    )
                }

                if (initializationIdRef.current === initializationId) {
                    setIsInitialized(true)
                }
            } catch (error) {
                console.error('Failed to initialize payments date filter', error)
            } finally {
                if (initializationIdRef.current === initializationId) {
                    isInitializationInProgressRef.current = false
                }
            }
        }

        void initialize()

        return () => {
            if (initializationIdRef.current === initializationId) {
                initializationIdRef.current += 1
                isInitializationInProgressRef.current = false
            }
        }
    }, [isInitialized, isPaymentsRouteReady, router, type])

    return isPaymentsRouteReady && isInitialized
}
