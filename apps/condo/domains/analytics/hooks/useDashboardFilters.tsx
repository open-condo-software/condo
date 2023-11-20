import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import React, { useState, useMemo, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { MAX_TAG_TEXT_LENGTH } from '@condo/domains/analytics/utils/helpers'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { searchOrganizationProperty, searchEmployeeUser } from '@condo/domains/ticket/utils/clientSchema/search'

import type { ISearchInputProps } from '@condo/domains/common/components/GraphQlSearchInput/'

const DATE_RANGE_STYLE: React.CSSProperties = { width: '100%' }

type UseSearchInputType = (props: Pick<ISearchInputProps, 'search' | 'placeholder'>) => {
    values: Array<string>
    SearchInput: React.ReactElement
}

const useSearchInput: UseSearchInputType = ({ placeholder, search }) => {
    const [values, setValues] = useState<string[]>([])

    const onChange = useCallback((values) => {
        setValues(values)
    }, [])

    const SearchInput = useMemo(() => (
        <GraphQlSearchInput
            allowClear
            search={search}
            mode='multiple'
            infinityScroll
            value={values}
            onChange={onChange}
            maxTagCount='responsive'
            maxTagTextLength={MAX_TAG_TEXT_LENGTH}
            placeholder={placeholder}
            style={{ width: '100%' }}
        />
    ), [search, values, onChange, placeholder])

    return { values, SearchInput }
}

type UseFilterType = ({ organizationId }: { organizationId: string }) => {
    values: Array<string>,
    SearchInput: React.ReactElement
}

export const usePropertyFilter: UseFilterType = ({ organizationId }) => {
    const intl = useIntl()
    const PlaceholderMessage = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.AllAddressesPlaceholder' })

    const { values, SearchInput } = useSearchInput({
        placeholder: PlaceholderMessage,
        search: searchOrganizationProperty(organizationId),
    })

    return { values, SearchInput }
}

export const useExecutorFilter: UseFilterType = ({ organizationId }) => {
    const intl = useIntl()
    const PlaceholderMessage = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.AllExecutorsPlaceholder' })

    const { values, SearchInput } = useSearchInput({
        placeholder: PlaceholderMessage,
        search: searchEmployeeUser(organizationId, ({ role }) => (
            get(role, 'canBeAssignedAsExecutor', false)
        )),
    })

    return { values, SearchInput }
}

type UseDateRangeFilterType = () => {
    SearchInput: typeof DateRangePicker
    dateRange: [Dayjs, Dayjs]
}

export const useDateRangeFilter: UseDateRangeFilterType = () => {
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(6, 'days'), dayjs()])

    const disabledDate = useCallback((currentDate) => {
        return currentDate && currentDate < dayjs().startOf('year')
    }, [])
    const onChange = useCallback((dateRange) => setDateRange([dateRange[0], dateRange[1]]), [])

    const SearchInput = useMemo(() => ({ disabled = false }) => (
        <DateRangePicker
            value={dateRange}
            onChange={onChange}
            allowClear={false}
            disabled={disabled}
            disabledDate={disabledDate}
            style={DATE_RANGE_STYLE}
        />
    ), [dateRange, disabledDate, onChange])

    return {
        dateRange,
        SearchInput,
    }
}
