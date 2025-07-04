import {
    CallRecordFragment as ICallRecordFragment,
    OrganizationWhereInput, SortCallRecordFragmentsBy,
} from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import omit from 'lodash/omit'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { Loader } from '@condo/domains/common/components/Loader'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { usePreviousSortAndFilters } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { PageComponentType } from '@condo/domains/common/types'
import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery, updateQuery } from '@condo/domains/common/utils/helpers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { CallRecordModal } from '@condo/domains/ticket/components/CallRecordModal'
import { CallRecordReadPermissionRequired } from '@condo/domains/ticket/components/PageAccess'
import { useCallRecordTableColumns } from '@condo/domains/ticket/hooks/useCallRecordTableColumns'
import { useCallRecordTableFilters } from '@condo/domains/ticket/hooks/useCallRecordTableFilters'
import { CallRecordFragment } from '@condo/domains/ticket/utils/clientSchema'


export type BaseQueryType = { organization: OrganizationWhereInput }

const ROW_GUTTER: RowProps['gutter'] = [0, 40]
const FILTER_ROW_GUTTER: RowProps['gutter'] = [16, 16]

const SHOW_TIME_CONFIG = { defaultValue: dayjs('00:00:00:000', 'HH:mm:ss:SSS') }
const FULL_WIDTH_STYLE: React.CSSProperties = { width: '100%' }

const StartedAtFilter = ({ placeholder, field }) => {
    const router = useRouter()

    const filtersFromQuery: Record<string, any> = useMemo(() => getFiltersFromQuery(router.query), [router.query])
    const updateStartedAtFilters = useMemo(() => debounce(async (value: Dayjs) => {
        const newFilters = isEmpty(value) ?
            omit(filtersFromQuery, field) : { ...filtersFromQuery, [field]: value.toISOString() }

        const newParameters = getFiltersQueryData(newFilters)
        await updateQuery(router, { newParameters }, { resetOldParameters: false, shallow: true })
    }, 400), [field, filtersFromQuery, router])

    const handleDateChange = useCallback((value) => updateStartedAtFilters(value), [updateStartedAtFilters])

    const initialStartedAtFilter = get(filtersFromQuery, field) && dayjs(filtersFromQuery[field])

    return (
        <DatePicker
            format='DD MMMM YYYY HH:mm'
            showTime={SHOW_TIME_CONFIG}
            placeholder={placeholder}
            onChange={handleDateChange}
            defaultValue={initialStartedAtFilter}
            style={FULL_WIDTH_STYLE}
        />
    )
}

const FilterContainer = () => {
    const intl = useIntl()
    const SearchPlaceholderMessage = intl.formatMessage({ id: 'filters.FullSearch' })
    const StartDateMessage = intl.formatMessage({ id: 'callRecord.filters.startDate' })
    const EndDateMessage = intl.formatMessage({ id: 'callRecord.filters.endDate' })

    const [search, changeSearch] = useSearch()

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        changeSearch(e.target.value)
    }, [changeSearch])

    return (
        <Col span={24}>
            <TableFiltersContainer>
                <Row gutter={FILTER_ROW_GUTTER} align='middle'>
                    <Col span={24}>
                        <Input
                            placeholder={SearchPlaceholderMessage}
                            onChange={handleSearchChange}
                            value={search}
                            allowClear
                            id='searchCallRecords'
                            suffix={<Search size='medium' color={colors.gray[7]} />}
                        />
                    </Col>
                    <Col span={24} lg={20} xl={14} xxl={12}>
                        <Row gutter={FILTER_ROW_GUTTER} align='middle'>
                            <Col span={24} xs={24} sm={12}>
                                <StartedAtFilter
                                    placeholder={StartDateMessage}
                                    field='startedAtGte'
                                />
                            </Col>
                            <Col span={24} xs={24} sm={12}>
                                <StartedAtFilter
                                    placeholder={EndDateMessage}
                                    field='startedAtLte'
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </TableFiltersContainer>
        </Col>
    )
}

const SORTABLE_PROPERTIES = ['startedAt']
const CALL_RECORD_FRAGMENTS_DEFAULT_SORT_BY = ['startedAt_DESC', 'createdAt_DESC']

const TableContainer = (props) => {
    const { useTableColumns, filterMetas, baseQuery } = props

    const router = useRouter()

    const [selectedCallRecordFragment, setSelectedCallRecordFragment] = useState<ICallRecordFragment>()
    const [autoPlay, setAutoPlay] = useState<boolean>(false)

    const columns = useTableColumns({ filterMetas, setSelectedCallRecordFragment, setAutoPlay })

    const { filters, sorters, offset } = parseQuery(router.query)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, SORTABLE_PROPERTIES)
    const sortBy = sortersToSortBy(sorters, CALL_RECORD_FRAGMENTS_DEFAULT_SORT_BY) as SortCallRecordFragmentsBy[]
    const searchCallRecordFragmentsQuery = useMemo(() => ({ ...baseQuery, ...filtersToWhere(filters) }),
        [baseQuery, filters, filtersToWhere])
    const currentPageIndex = useMemo(() => getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE), [offset])

    const {
        loading: isCallRecordsLoading,
        count: total,
        objs: callRecordFragments,
        refetch,
    } = CallRecordFragment.useObjects({
        sortBy,
        where: searchCallRecordFragmentsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const loading = isCallRecordsLoading

    const handleRowAction = (record) => {
        return {
            onClick: () => {
                setAutoPlay(false)
                setSelectedCallRecordFragment(record)
            },
        }
    }

    return (
        <>
            <Col span={24}>
                <Table
                    totalRows={loading ? 0 : total}
                    dataSource={loading ? [] : callRecordFragments}
                    columns={columns}
                    loading={loading}
                    onRow={handleRowAction}
                />
            </Col>
            <CallRecordModal
                autoPlay={autoPlay}
                selectedCallRecordFragment={selectedCallRecordFragment}
                setSelectedCallRecordFragment={setSelectedCallRecordFragment}
                refetchFragments={refetch}
            />
        </>
    )
}

export const CallRecordsPageContent = (props) => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({  id: 'callRecord.index.title' })
    const EmptyListLabel = intl.formatMessage({ id: 'callRecord.index.emptyList.title' })
    const EmptyListMessage = intl.formatMessage({ id: 'callRecord.index.emptyList.description' })

    const { filterMetas, useTableColumns, baseQuery, baseQueryLoading = false } = props

    const {
        count: callRecordTotal,
        loading: callRecordTotalLoading,
    } = CallRecordFragment.useCount({ where: { ...baseQuery } })

    const PageContet = useMemo(() => {
        if (baseQueryLoading || callRecordTotalLoading) {
            return <Loader fill size='large' />
        }

        if (!callRecordTotal) {
            return (
                <EmptyListContent
                    label={EmptyListLabel}
                    message={EmptyListMessage}
                />
            )
        }

        return (
            <Row gutter={ROW_GUTTER} align='middle' justify='center'>
                <FilterContainer />
                <TableContainer
                    useTableColumns={useTableColumns}
                    filterMetas={filterMetas}
                    baseQuery={baseQuery}
                />
            </Row>
        )
    }, [baseQueryLoading, callRecordTotalLoading, callRecordTotal, filterMetas, useTableColumns, baseQuery, EmptyListLabel, EmptyListMessage])

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
                <TablePageContent>
                    {PageContet}
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const CallRecordsPage: PageComponentType = () => {
    const filterMetas = useCallRecordTableFilters()
    const { organization, link } = useOrganization()
    const organizationId = get(organization, 'id')
    const employeeId = get(link, 'id')
    const baseQuery: BaseQueryType = useMemo(() => ({ organization: { id: organizationId } }), [organizationId])

    usePreviousSortAndFilters({ employeeSpecificKey: employeeId })

    return (
        <CallRecordsPageContent
            baseQuery={baseQuery}
            filterMetas={filterMetas}
            useTableColumns={useCallRecordTableColumns}
        />
    )
}

CallRecordsPage.requiredAccess = CallRecordReadPermissionRequired

export default CallRecordsPage
