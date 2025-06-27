import { useGetPaymentsFilesQuery } from '@app/condo/gql'
import { PaymentsFile as IPaymentsFile, SortPaymentsFilesBy } from '@app/condo/schema'
import { Col, Row } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'
import { Gutter } from 'antd/lib/grid/row'
import { TableRowSelection } from 'antd/lib/table/interface'
import dayjs, { Dayjs } from 'dayjs'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import { NextRouter, useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { Download, Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Checkbox } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { PaymentsSumTable } from '@condo/domains/acquiring/components/payments/PaymentsSumTable'
import { PaymentsSumInfo } from '@condo/domains/acquiring/components/payments/PaymentsTable'
import useDownloadPaymentsFiles from '@condo/domains/acquiring/hooks/useDownloadPaymentsFiles'
import { usePaymentsFilesTableColumns } from '@condo/domains/acquiring/hooks/usePaymentsFilesTableColumns'
import { usePaymentsFilesTableFilters } from '@condo/domains/acquiring/hooks/usePaymentsFilesTableFilters'
import usePaymentsSum from '@condo/domains/acquiring/hooks/usePaymentsSum'
import { getInitialSelectedRegistryKeys, IPaymentsFilesFilters } from '@condo/domains/acquiring/utils/helpers'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import Input from '@condo/domains/common/components/antd/Input'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import { MultipleFilterContextProvider } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'


const SORTABLE_PROPERTIES = ['amount', 'loadedAt']
const PAYMENTS_DEFAULT_SORT_BY = ['loadedAt_DESC']
const DEFAULT_CURRENCY_CODE = 'RUB'
const DEFAULT_DATE_RANGE: [Dayjs, Dayjs] = [dayjs().subtract(1, 'week'), dayjs()]
const DEBOUNCE_TIMEOUT = 400

const ROW_GUTTER: [Gutter, Gutter] = [0, 30]
const TAP_BAR_ROW_GUTTER: [Gutter, Gutter] = [0, 20]
const SUM_BAR_COL_GUTTER: [Gutter, Gutter] = [40, 0]
const DATE_PICKER_COL_LAYOUT = { span: 11, offset: 1 }
const BOTTOM_PADDING_LIKE_ACTION_BAR: CSSProperties = { paddingBottom: '104px' }


const PaymentFilesTableContent: React.FC = (): JSX.Element => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const TotalsSumTitle = intl.formatMessage({ id: 'pages.condo.payments.TotalSum' })
    const CancelSelectedRegistryMessage = intl.formatMessage({ id: 'global.cancelSelection' })
    const DownloadRegistriesMessage = intl.formatMessage({ id: 'Download' })

    const { acquiringContext, billingContexts } = useBillingAndAcquiringContexts()
    const { persistor } = useCachePersistor()

    const { breakpoints } = useLayoutContext()
    const router = useRouter()
    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], '')

    const { filters, sorters, offset } = parseQuery(router.query)

    // TODO(dkovyazin): DOMA-11394 find out why acquiring uses currency from billing integration
    const currencyCode = get(billingContexts.find(({ integration }) => !!integration.currencyCode), ['integration', 'currencyCode'], DEFAULT_CURRENCY_CODE)

    const tableColumns = usePaymentsFilesTableColumns(currencyCode)
    const queryMetas = usePaymentsFilesTableFilters(organizationId)
    const [isFilesDownloading, setIsFilesDownloading] = useState(false)
    const [selectedRegistryKeys, setSelectedRegistryKeys] = useState<string[]>(() => getInitialSelectedRegistryKeys(router))
    const CountSelectedRegistryMessage = intl.formatMessage({ id: 'ItemsSelectedCount' }, { count: selectedRegistryKeys.length })

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, SORTABLE_PROPERTIES)

    const [filtersAreReset, setFiltersAreReset] = useState(false)
    const dateFallback = filtersAreReset ? null : DEFAULT_DATE_RANGE
    const [dateRange, setDateRange] = useDateRangeSearch('loadedAt')
    const dateFilterValue = dateRange || dateFallback
    const dateFilter = dateFilterValue ? dateFilterValue.map(el => el.toISOString()) : null

    const searchPaymentsFilesQuery: Record<string, unknown> = {
        ...filtersToWhere({ loadedAt: dateFilter, ...filters }),
        context: { id: acquiringContext.id },
    }
    const sortBy = sortersToSortBy(sorters, PAYMENTS_DEFAULT_SORT_BY)

    const {
        data,
        loading,
        refetch,
    } = useGetPaymentsFilesQuery({
        variables: {
            where: searchPaymentsFilesQuery,
            sortBy: sortBy as SortPaymentsFilesBy[],
            first: DEFAULT_PAGE_SIZE,
            skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
        },
        skip: !acquiringContext?.id || !persistor,
        fetchPolicy: 'network-only', // TODO(@abshnko): remove when sorters work with cache
    })

    const paymentsFiles = useMemo(() => data?.paymentsFiles?.filter(Boolean) || [], [data?.paymentsFiles])
    const total = useMemo(() => data?.meta?.count, [data?.meta?.count])

    const { downloadPaymentsFiles } = useDownloadPaymentsFiles(refetch)
    const selectedRowKeysByPage = useMemo(() => {
        return paymentsFiles?.filter(file => selectedRegistryKeys.includes(file.id)).map(file => file.id) || []
    }, [selectedRegistryKeys, paymentsFiles])

    const { data: sumAllPayments, loading: sumAllPaymentsLoading } = usePaymentsSum({ paymentsFilesWhere: searchPaymentsFilesQuery })

    const [search, handleSearchChange] = useSearch<IPaymentsFilesFilters>()
    const handleDateChange = useCallback((value) => {
        if (!value) {
            setFiltersAreReset(true)
        }
        setDateRange(value)
    }, [setDateRange])

    const handleResetSelectedRegistry = useCallback(() => {
        setSelectedRegistryKeys([])
    }, [])

    const handleDownloadClick = async () => {
        setIsFilesDownloading(true)
        await downloadPaymentsFiles(selectedRegistryKeys)
        setSelectedRegistryKeys([])
        changeQuery(router, [])
        setIsFilesDownloading(false)
    }

    const changeQuery = useMemo(() => debounce(async (router: NextRouter, selectedRegistryKeys: string[]) => {
        await updateQuery(router, { newParameters: { selectedRegistryIds: selectedRegistryKeys } }, {
            routerAction: 'replace',
            resetOldParameters: false,
            shallow: true,
        })
    }, DEBOUNCE_TIMEOUT), [])

    const updateSelectedRegistryKeys = useCallback((selectedRegistryKeys: string[]) => {
        setSelectedRegistryKeys(selectedRegistryKeys)
        changeQuery(router, selectedRegistryKeys)
    }, [changeQuery, router])

    const isSelectedAllRowsByPage = !loading && selectedRowKeysByPage.length > 0 && selectedRowKeysByPage.length === paymentsFiles.length
    const isSelectedSomeRowsByPage = !loading && selectedRowKeysByPage.length > 0 && selectedRowKeysByPage.length < paymentsFiles.length

    const handleSelectAllRowsByPage = useCallback((e: CheckboxChangeEvent) => {
        const checked = e.target.checked
        if (checked) {
            const newSelectedRegistryKeys = paymentsFiles
                ?.filter(file => !selectedRowKeysByPage.includes(file.id))
                .map(file => file.id)
            updateSelectedRegistryKeys([...selectedRegistryKeys, ...newSelectedRegistryKeys])
        } else {
            updateSelectedRegistryKeys(selectedRegistryKeys.filter(key => !selectedRowKeysByPage.includes(key)))
        }
    }, [updateSelectedRegistryKeys, selectedRegistryKeys, selectedRowKeysByPage, paymentsFiles])

    const handleSelectRow: (record: IPaymentsFile, checked: boolean) => void = useCallback((record, checked) => {
        const selectedKey = record.id
        if (checked) {
            updateSelectedRegistryKeys([...selectedRegistryKeys, selectedKey])
        } else {
            updateSelectedRegistryKeys(selectedRegistryKeys.filter(key => selectedKey !== key))
        }
    }, [selectedRegistryKeys, updateSelectedRegistryKeys])

    const rowSelection: TableRowSelection<IPaymentsFile> = useMemo(() => ({
        selectedRowKeys: selectedRowKeysByPage,
        fixed: true,
        onSelect: handleSelectRow,
        columnTitle: (
            <Checkbox
                checked={isSelectedAllRowsByPage}
                indeterminate={isSelectedSomeRowsByPage}
                onChange={handleSelectAllRowsByPage}
            />
        ),
    }), [handleSelectAllRowsByPage, handleSelectRow, isSelectedAllRowsByPage, isSelectedSomeRowsByPage, selectedRowKeysByPage])


    return (
        <Row gutter={ROW_GUTTER} align='middle' justify='center'>
            <Col span={24}>
                <TableFiltersContainer>
                    <Row justify={breakpoints.DESKTOP_SMALL ? 'end' : 'start'} gutter={TAP_BAR_ROW_GUTTER}>
                        <Col flex='auto'>
                            <Row gutter={TAP_BAR_ROW_GUTTER}>
                                <Col xs={24} lg={8}>
                                    <Input
                                        placeholder={SearchPlaceholder}
                                        value={search}
                                        onChange={(e) => {
                                            handleSearchChange(e.target.value)
                                        }}
                                        allowClear
                                        suffix={<Search size='medium' color={colors.gray[7]} />}
                                    />
                                </Col>
                                <Col xs={24} lg={DATE_PICKER_COL_LAYOUT}>
                                    <DateRangePicker
                                        value={dateRange || dateFallback}
                                        onChange={handleDateChange}
                                        placeholder={[StartDateMessage, EndDateMessage]}
                                    />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </TableFiltersContainer>
            </Col>

            <Col span={24}>
                <PaymentsSumTable>
                    <Row justify='center' gutter={SUM_BAR_COL_GUTTER}>
                        <Col>
                            <PaymentsSumInfo
                                title={TotalsSumTitle}
                                message={sumAllPayments?.result?.sum}
                                currencyCode={currencyCode}
                                loading={sumAllPaymentsLoading}
                            />
                        </Col>
                    </Row>
                </PaymentsSumTable>
            </Col>

            <Col span={24}>
                <Table
                    loading={loading}
                    dataSource={paymentsFiles}
                    totalRows={total}
                    columns={tableColumns}
                    rowSelection={rowSelection}
                />
            </Col>
            <Col span={24}>
                {!loading && total > 0 && selectedRegistryKeys.length > 0 && (
                    <ActionBar
                        message={CountSelectedRegistryMessage}
                        actions={[
                            <Button
                                key='create'
                                type='primary'
                                loading={isFilesDownloading}
                                icon={<Download size='medium' />}
                                onClick={handleDownloadClick}
                            >
                                {DownloadRegistriesMessage}
                            </Button>,
                            <Button
                                key='cancelPaymentsFileSelection'
                                type='secondary'
                                children={CancelSelectedRegistryMessage}
                                onClick={handleResetSelectedRegistry}
                                loading={isFilesDownloading}
                            />,
                        ]}
                    />
                )}
            </Col>
            <Col style={BOTTOM_PADDING_LIKE_ACTION_BAR}></Col>
        </Row>
    )
}

const PaymentFilesTable = () => {
    return (
        <MultipleFilterContextProvider>
            <PaymentFilesTableContent />
        </MultipleFilterContextProvider>
    )
}

export default PaymentFilesTable