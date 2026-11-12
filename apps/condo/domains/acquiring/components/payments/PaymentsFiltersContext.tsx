import { PaymentWhereInput, PaymentsFileWhereInput } from '@app/condo/schema'
import { Col, Row } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { useRouter } from 'next/router'
import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { PaymentsTableFilterBar } from '@condo/domains/acquiring/components/payments/PaymentsTableFilterBar'
import { usePaymentsFilesTableFilters } from '@condo/domains/acquiring/hooks/usePaymentsFilesTableFilters'
import { usePaymentsTableFilters } from '@condo/domains/acquiring/hooks/usePaymentsTableFilters'
import { PaymentsFilterTemplate, VIEW_TYPES, ViewTypes } from '@condo/domains/acquiring/utils/clientSchema'
import {
    MultipleFilterContextProvider,
    useMultipleFilterContext,
    useMultipleFiltersModal,
} from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { FiltersMeta, getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery, updateQuery } from '@condo/domains/common/utils/helpers'
import { FiltersFromQueryType } from '@condo/domains/common/utils/tables.utils'


const FILTERS_GUTTER: [number, number] = [0, 24]

type PaymentsFiltersContextValue = {
    clearDateFilter: () => void
    dateFilter: string[] | null
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
    const { setSelectedFiltersTemplate } = useMultipleFilterContext()
    const organizationId = userOrganization?.organization?.id ?? ''
    const paymentFilterMetas = usePaymentsTableFilters(organizationId)
    const paymentsFileFilterMetas = usePaymentsFilesTableFilters(organizationId)
    const activeFilterMetas = type === VIEW_TYPES.registry
        ? paymentsFileFilterMetas as FiltersMeta<PaymentWhereInput | PaymentsFileWhereInput>[]
        : paymentFilterMetas as FiltersMeta<PaymentWhereInput | PaymentsFileWhereInput>[]

    const dateFilterKey = type === VIEW_TYPES.registry ? 'paymentPeriod' : 'depositedDate'
    const filters = useMemo(
        () => getFiltersFromQuery<FiltersFromQueryType>(router.query) as FiltersFromQueryType,
        [router.query]
    )
    const dateFilterValue = filters[dateFilterKey]
    const dateRange = useMemo(() => (
        Array.isArray(dateFilterValue) && dateFilterValue.length === 2
            ? [dayjs(dateFilterValue[0]), dayjs(dateFilterValue[1])] as [Dayjs, Dayjs]
            : null
    ), [dateFilterValue])
    const dateFilter = dateRange ? dateRange.map(date => date.toISOString()) : null
    const [search, handleSearchChange, handleResetSearch] = useSearch<FiltersFromQueryType>()

    useEffect(() => {
        setSelectedFiltersTemplate(null)
    }, [setSelectedFiltersTemplate, type])

    const updateDateFilter = useCallback(async (value: [Dayjs, Dayjs] | null) => {
        const nextFilters = {
            ...filters,
            [dateFilterKey]: value?.map(date => date.toISOString()),
        }

        await updateQuery(
            router,
            {
                newParameters: {
                    ...getFiltersQueryData(nextFilters),
                    tab: 'payments',
                    type,
                },
            },
            { resetOldParameters: false, routerAction: 'replace', shallow: true }
        )
    }, [dateFilterKey, filters, router, type])

    const handleDateChange = useCallback((value: [Dayjs, Dayjs] | null) => {
        void updateDateFilter(value)
    }, [updateDateFilter])

    const clearDateFilter = useCallback(() => {
        void updateDateFilter(null)
    }, [updateDateFilter])

    const onReset = useCallback(() => {
        handleResetSearch()
    }, [handleResetSearch])

    const {
        MultipleFiltersModal,
        ResetFiltersModalButton,
        OpenFiltersButton,
        appliedFiltersCount,
    } = useMultipleFiltersModal({
        filterMetas: activeFilterMetas,
        filtersSchemaGql: PaymentsFilterTemplate,
        onReset,
        extraQueryParameters: { tab: 'payments', type },
    })

    const contextValue = useMemo<PaymentsFiltersContextValue>(() => ({
        clearDateFilter,
        dateFilter,
        paymentsFileFilterMetas,
        paymentFilterMetas,
        search,
    }), [clearDateFilter, dateFilter, paymentFilterMetas, paymentsFileFilterMetas, search])

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
                    modalFilters={{
                        count: appliedFiltersCount,
                        resetButton: <ResetFiltersModalButton />,
                        openButton: <OpenFiltersButton showLabel={false} />,
                    }}
                />
                <Col span={24}>{children}</Col>
            </Row>
            <MultipleFiltersModal />
        </PaymentsFiltersContext.Provider>
    )
}

export const PaymentsFiltersProvider: React.FC<PaymentsFiltersContentProps> = ({ children, type }) => {
    return (
        <MultipleFilterContextProvider>
            <PaymentsFiltersContent type={type}>
                {children}
            </PaymentsFiltersContent>
        </MultipleFilterContextProvider>
    )
}
