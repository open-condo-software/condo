import { PaymentWhereInput, PaymentsFileWhereInput } from '@app/condo/schema'
import { Col, Row } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import debounce from 'lodash/debounce'
import { useRouter } from 'next/router'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { PaymentsTableFilterBar } from '@condo/domains/acquiring/components/payments/PaymentsTableFilterBar'
import { usePaymentsFilesTableFilters } from '@condo/domains/acquiring/hooks/usePaymentsFilesTableFilters'
import { usePaymentsTableFilters } from '@condo/domains/acquiring/hooks/usePaymentsTableFilters'
import { VIEW_TYPES, ViewTypes } from '@condo/domains/acquiring/utils/clientSchema'
import { FiltersMeta, getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery, updateQuery } from '@condo/domains/common/utils/helpers'
import { FiltersFromQueryType } from '@condo/domains/common/utils/tables.utils'


const FILTERS_GUTTER: [number, number] = [0, 24]

type PaymentsFiltersContextValue = {
    clearDateFilter: () => void
    paymentsFileFilterMetas: FiltersMeta<PaymentsFileWhereInput>[]
    paymentFilterMetas: FiltersMeta<PaymentWhereInput>[]
    search: string
}

const PaymentsFiltersContext = createContext<PaymentsFiltersContextValue | null>(null)

export const usePaymentsFilters = (): PaymentsFiltersContextValue => {
    const context = useContext(PaymentsFiltersContext)
    if (!context) {
        throw new Error('usePaymentsFilters must be used inside PaymentsFiltersProvider')
    }

    return context
}

type PaymentsFiltersContentProps = React.PropsWithChildren<{
    type: ViewTypes
}>

const PaymentsFiltersContent: React.FC<PaymentsFiltersContentProps> = ({ children, type }) => {
    const intl = useIntl()
    const router = useRouter()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })

    const userOrganization = useOrganization()
    const organizationId = userOrganization?.organization?.id ?? ''
    const paymentFilterMetas = usePaymentsTableFilters(organizationId)
    const paymentsFileFilterMetas = usePaymentsFilesTableFilters(organizationId)

    const dateFilterKey = type === VIEW_TYPES.registry ? 'paymentPeriod' : 'depositedDate'
    const filters = useMemo(
        () => getFiltersFromQuery<FiltersFromQueryType>(router.query) as FiltersFromQueryType,
        [router.query]
    )
    const dateFilterValue = filters[dateFilterKey]
    const dateRange = useMemo(() => {
        if (!Array.isArray(dateFilterValue) || dateFilterValue.length !== 2) return null

        const range = [dayjs(dateFilterValue[0]), dayjs(dateFilterValue[1])] as [Dayjs, Dayjs]
        return range.every(date => date.isValid()) ? range : null
    }, [dateFilterValue])
    const searchFromQuery = typeof filters.search === 'string' ? filters.search : ''
    const [search, setSearch] = useState(searchFromQuery)
    const pendingSearchRef = useRef<string | null>(null)
    const filtersUpdateQueueRef = useRef<Promise<void>>(Promise.resolve())
    const updateGenerationRef = useRef(0)

    useEffect(() => {
        const generation = ++updateGenerationRef.current

        return () => {
            if (updateGenerationRef.current === generation) {
                updateGenerationRef.current += 1
            }
        }
    }, [type])

    useEffect(() => {
        if (pendingSearchRef.current === null) {
            setSearch(searchFromQuery)
        }
    }, [searchFromQuery])

    const enqueueFiltersUpdate = useCallback((
        getNextFilters: (currentFilters: FiltersFromQueryType) => FiltersFromQueryType
    ): Promise<void> => {
        const generation = updateGenerationRef.current
        const requestedType = type

        filtersUpdateQueueRef.current = filtersUpdateQueueRef.current
            .catch(() => undefined)
            .then(async () => {
                if (updateGenerationRef.current !== generation) return

                const currentFilters = getFiltersFromQuery<FiltersFromQueryType>(router.query) as FiltersFromQueryType
                const nextFilters = getNextFilters(currentFilters)

                if (updateGenerationRef.current !== generation) return

                try {
                    await updateQuery(
                        router,
                        {
                            newParameters: {
                                ...getFiltersQueryData(nextFilters),
                                tab: 'payments',
                                type: requestedType,
                            },
                        },
                        { resetOldParameters: false, routerAction: 'replace', shallow: true }
                    )
                } catch (error) {
                    console.error('Failed to update payments filters', error)
                }
            })

        return filtersUpdateQueueRef.current
    }, [router, type])
    const enqueueFiltersUpdateRef = useRef(enqueueFiltersUpdate)
    enqueueFiltersUpdateRef.current = enqueueFiltersUpdate

    const updateSearch = useMemo(() => debounce((value: string) => {
        void enqueueFiltersUpdateRef.current(currentFilters => ({ ...currentFilters, search: value }))
            .finally(() => {
                if (pendingSearchRef.current === value) {
                    pendingSearchRef.current = null
                }
            })
    }, 400), [])

    useEffect(() => () => {
        updateSearch.cancel()
        pendingSearchRef.current = null
    }, [type, updateSearch])

    const handleSearchChange = useCallback((value: string) => {
        pendingSearchRef.current = value
        setSearch(value)
        updateSearch(value)
    }, [updateSearch])

    const updateDateFilter = useCallback((value: [Dayjs, Dayjs] | null) => {
        const serializedValue = value?.every(date => date.isValid())
            ? value.map(date => date.toISOString())
            : undefined

        void enqueueFiltersUpdate(currentFilters => ({
            ...currentFilters,
            [dateFilterKey]: serializedValue,
        }))
    }, [dateFilterKey, enqueueFiltersUpdate])

    const handleDateChange = useCallback((value: [Dayjs, Dayjs] | null) => {
        updateDateFilter(value)
    }, [updateDateFilter])

    const clearDateFilter = useCallback(() => {
        updateDateFilter(null)
    }, [updateDateFilter])

    const contextValue = useMemo<PaymentsFiltersContextValue>(() => ({
        clearDateFilter,
        paymentsFileFilterMetas,
        paymentFilterMetas,
        search,
    }), [clearDateFilter, paymentFilterMetas, paymentsFileFilterMetas, search])

    return (
        <PaymentsFiltersContext.Provider value={contextValue}>
            <Row gutter={FILTERS_GUTTER}>
                <PaymentsTableFilterBar
                    search={{ value: search, placeholder: SearchPlaceholder, onChange: handleSearchChange }}
                    datePickerProps={{
                        value: dateRange,
                        onChange: handleDateChange,
                        placeholder: [StartDateMessage, EndDateMessage],
                    }}
                />
                <Col span={24}>{children}</Col>
            </Row>
        </PaymentsFiltersContext.Provider>
    )
}

export const PaymentsFiltersProvider: React.FC<PaymentsFiltersContentProps> = ({ children, type }) => {
    return (
        <PaymentsFiltersContent type={type}>
            {children}
        </PaymentsFiltersContent>
    )
}
