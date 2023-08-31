import get from 'lodash/get'
import React, { useState, useMemo, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { MAX_TAG_TEXT_LENGTH } from '@condo/domains/analytics/utils/helpers'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { searchOrganizationProperty, searchEmployeeUser } from '@condo/domains/ticket/utils/clientSchema/search'

import type { ISearchInputProps } from '@condo/domains/common/components/GraphQlSearchInput/'

interface IUseSearchInput {
    (props: Pick<ISearchInputProps, 'search' | 'placeholder'>): {
        values: Array<string>
        SearchInput: React.ReactElement
    }
}

const useSearchInput: IUseSearchInput = ({ placeholder, search }) => {
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

interface IUseFilter {
    ({ organizationId }: { organizationId: string }): {
        values: Array<string>,
        SearchInput: React.ReactElement
    }
}

export const usePropertyFilter: IUseFilter = ({ organizationId }) => {
    const intl = useIntl()
    const PlaceholderMessage = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.AllAddressesPlaceholder' })

    const { values, SearchInput } = useSearchInput({
        placeholder: PlaceholderMessage,
        search: searchOrganizationProperty(organizationId),
    })

    return { values, SearchInput }
}

export const useExecutorFilter: IUseFilter = ({ organizationId }) => {
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
