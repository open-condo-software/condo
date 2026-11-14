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
    const [initializedType, setInitializedType] = useState<ViewTypes | null>(null)
    const isInitializationInProgressRef = useRef(false)
    const initializationIdRef = useRef(0)
    const isInitialized = isPaymentsRouteReady && initializedType === type

    useEffect(() => {
        const initializationId = ++initializationIdRef.current

        if (!isPaymentsRouteReady) {
            isInitializationInProgressRef.current = false
            setInitializedType(null)
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

        const initialize = async (): Promise<void> => {
            try {
                if (!hasValidDateFilter) {
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

                if (initializationIdRef.current === initializationId) {
                    setInitializedType(type)
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

    return isInitialized
}
