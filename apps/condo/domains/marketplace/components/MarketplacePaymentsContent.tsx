import { useQuery } from '@apollo/client'
import { Payment as PaymentType, PaymentStatusType, PaymentWhereInput, SortPaymentsBy } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row, RowProps, Space, Spin } from 'antd'
import { TableRowSelection } from 'antd/lib/table/interface'
import dayjs from 'dayjs'
import get from 'lodash/get'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Modal, Checkbox, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'
import { useBreakpoints } from '@open-condo/ui/dist/hooks'

import { PaymentsSumTable } from '@condo/domains/acquiring/components/payments/PaymentsSumTable'
import { EXPORT_PAYMENTS_TO_EXCEL, SUM_PAYMENTS_QUERY } from '@condo/domains/acquiring/gql'
import { usePosIntegrationAlert } from '@condo/domains/acquiring/hooks/usePosIntegrationAlert'
import { usePosIntegrationLastTestingPosReceipt } from '@condo/domains/acquiring/hooks/usePosIntegrationLastTestingPosReceipt'
import { Payment } from '@condo/domains/acquiring/utils/clientSchema'
import Input from '@condo/domains/common/components/antd/Input'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { Loader } from '@condo/domains/common/components/Loader'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { getMoneyRender } from '@condo/domains/common/components/Table/Renders'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { getFiltersFromQuery, getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useMarketplacePaymentsFilters } from '@condo/domains/marketplace/hooks/useMarketplacePaymentsFilters'
import { useMarketplacePaymentTableColumns } from '@condo/domains/marketplace/hooks/useMarketplacePaymentTableColumns'
import { MARKETPLACE_PAGE_TYPES } from '@condo/domains/marketplace/utils/clientSchema'

const { publicRuntimeConfig: { defaultCurrencyCode } } = getConfig()

const ROW_GUTTERS: RowProps['gutter'] = [16, 16]
const SUM_BAR_COL_GUTTER: RowProps['gutter'] = [40, 0]
const QUICK_FILTERS_COL_STYLE: CSSProperties = { alignSelf: 'center' }

function usePaymentsSum (whereQuery: PaymentWhereInput) {
    const { data, error, loading } = useQuery(SUM_PAYMENTS_QUERY, {
        fetchPolicy: 'cache-first',
        variables: {
            where: {
                ...whereQuery,
            },
        },
    })
    return { data, error, loading }
}

interface IPaymentsSumInfoProps {
    title: string
    message: string
    currencyCode?: string
    type?: 'success' | 'warning'
    loading: boolean
}

const PaymentsInfoWrapper = styled.div`
    & .condo-typography {
      margin-right: 8px;
    }
`

const MarketplacePaymentsSumInfo: React.FC<IPaymentsSumInfoProps> = ({
    title,
    message,
    currencyCode = defaultCurrencyCode,
    type,
    loading,
}) => {
    const intl = useIntl()

    return (
        <PaymentsInfoWrapper>
            <Typography.Text type='secondary'>{title}</Typography.Text>
            <Typography.Text
                type={type}
                strong={true}
            >
                {loading ? '…' : getMoneyRender(intl, currencyCode)(message)}
            </Typography.Text>
        </PaymentsInfoWrapper>
    )
}

const MarketplacePaymentsTable = () => {
    const { PosIntegrationAlert, loading: areAlertLoading } = usePosIntegrationAlert()

    return (
        <Space size={areAlertLoading ? 0 : 30} direction='vertical'>
            {PosIntegrationAlert}
            {areAlertLoading ? (
                <Spin size='large' />
            ) : (
                <MarketplacePaymentsTableContent areAlertLoading={areAlertLoading} />
            )}
        </Space>
    )
}

interface MarketplacePaymentsTableContentProps {
    areAlertLoading: boolean
}

const MarketplacePaymentsTableContent: React.FC<MarketplacePaymentsTableContentProps> = ({ areAlertLoading }) => {
    const intl = useIntl()
    const { lastTestingPosReceipt, loading: isLastTestingPosReceiptLoading, refetch: refetchLastTestingPosReceipt, b2bAppContext: posIntegrationContext } = usePosIntegrationLastTestingPosReceipt({
        skipUntilAuthenticated: areAlertLoading,
    })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const ClearListSelectedRowMessage = intl.formatMessage({ id: 'global.cancelSelection' })
    const AllPaymentsSumMessage = intl.formatMessage({ id: 'pages.condo.marketplace.payments.stats.allPayment' })
    const DonePaymentsSumMessage = intl.formatMessage({ id: 'pages.condo.marketplace.payments.stats.donePayment' })
    const WithdrawnPaymentsSumMessage = intl.formatMessage({ id: 'pages.condo.marketplace.payments.stats.inProcessPayment' })
    const ConfirmTitle = intl.formatMessage({ id: 'component.TicketWarningModal.ConfirmTitle' })
    const PaymentsOnlyInDoneStatusMessage = intl.formatMessage({ id: 'pages.condo.marketplace.payments.filters.onlyDoneStatus' })

    const breakpoints = useBreakpoints()
    const router = useRouter()
    const userOrganization = useOrganization()
    const orgId = get(userOrganization, ['organization', 'id'], null)

    const { filters, offset, sorters } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const queryMetas = useMarketplacePaymentsFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, [])

    const [isStatusDescModalVisible, setIsStatusDescModalVisible] = useState<boolean>(false)
    const [titleStatusDescModal, setTitleStatusDescModal] = useState('')
    const [textStatusDescModal, setTextStatusDescModal] = useState('')
    const openStatusDescModal = (statusType) => {
        const titleModal = intl.formatMessage({ id: 'payment.status.description.title.' + statusType as FormatjsIntl.Message['ids'] })
        const textModal = intl.formatMessage({ id: 'payment.status.description.text.' + statusType as FormatjsIntl.Message['ids'] })

        setTitleStatusDescModal(titleModal)
        setTextStatusDescModal(textModal)
        setIsStatusDescModalVisible(true)
    }
    const tableColumns = useMarketplacePaymentTableColumns(queryMetas, openStatusDescModal, { lastTestingPosReceipt, posIntegrationContext })

    useEffect(() => {
        if (!areAlertLoading) {
            refetchLastTestingPosReceipt()
        }
    }, [areAlertLoading, refetchLastTestingPosReceipt])

    const [showPaymentsOnlyInDoneStatus, setShowPaymentsOnlyInDoneStatus] = useState(false)
    const switchShowPaymentsOnlyInDoneStatus = useCallback(
        () => setShowPaymentsOnlyInDoneStatus(!showPaymentsOnlyInDoneStatus),
        [showPaymentsOnlyInDoneStatus]
    )

    const invoiceOrganizationQuery = useMemo(() => ({
        organization: { id: orgId },
        invoice: {
            organization: { id: orgId },
        },
    }), [orgId])

    const searchPaymentsQuery: PaymentWhereInput = useMemo(() => {
        return {
            ...invoiceOrganizationQuery,
            status_in: showPaymentsOnlyInDoneStatus ? [PaymentStatusType.Done] : [PaymentStatusType.Withdrawn, PaymentStatusType.Done],
        }
    }, [orgId, showPaymentsOnlyInDoneStatus])
    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortPaymentsBy[], [sorters, sortersToSortBy])

    const {
        loading: paymentsLoading,
        count: total,
        objs: payments,
    } = Payment.useObjects({
        sortBy,
        where: {
            ...filtersToWhere(filters),
            ...searchPaymentsQuery,
        },
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const { data: allPaymentsSum, loading: allPaymentsSumLoading } = usePaymentsSum({
        ...filtersToWhere(filters),
        ...invoiceOrganizationQuery,
        status_in: [PaymentStatusType.Withdrawn, PaymentStatusType.Done],
    })
    const { data: donePaymentsSum, loading: donePaymentsSumLoading } = usePaymentsSum({
        ...filtersToWhere(filters),
        ...invoiceOrganizationQuery,
        status_in: [PaymentStatusType.Done],
    })
    const { data: withdrawnPaymentsSum, loading: withdrawnPaymentsSumLoading } = usePaymentsSum({
        ...filtersToWhere(filters),
        ...invoiceOrganizationQuery,
        status_in: [PaymentStatusType.Withdrawn],
    })

    const [selectedRows, setSelectedRows] = useState([])

    const [search, handleSearchChange] = useSearch()
    const handleSearch = useCallback((e) => { handleSearchChange(e.target.value) }, [handleSearchChange])

    const [dateRange, setDateRange] = useDateRangeSearch('createdAt')
    const filtersFromQuery = useMemo(() => getFiltersFromQuery(router.query), [router.query])

    useEffect(() => {
        const createdAt = [dayjs().subtract(6, 'days').toString(), dayjs().toString()]
        const newParameters = getFiltersQueryData(
            { ...filtersFromQuery, createdAt }
        )
        updateQuery(router, {
            newParameters: { ...newParameters, tab: MARKETPLACE_PAGE_TYPES.payments },
        }, {
            routerAction: 'replace', resetOldParameters: false, shallow: true,
        })
    }, [])

    const disabledDate = useCallback((currentDate) => {
        const minDate = dayjs().startOf('year').subtract(1, 'year')
        const maxDate = dayjs().endOf('year')
        return currentDate && (currentDate < minDate || currentDate > maxDate)
    }, [])

    const handleSelectRow = useCallback((record, checked) => {
        const selectedKey = record.id
        if (checked) {
            setSelectedRows([...selectedRows, record])
        } else {
            setSelectedRows(selectedRows.filter(({ id }) => id !== selectedKey))
        }
    }, [selectedRows])

    const handleSelectAll = useCallback((checked) => {
        if (checked) {
            setSelectedRows(payments)
        } else {
            setSelectedRows([])
        }
    }, [payments])

    const rowSelection: TableRowSelection<PaymentType> = useMemo(() => ({
        type: 'checkbox',
        onSelect: handleSelectRow,
        onSelectAll: handleSelectAll,
        selectedRowKeys: selectedRows.map(row => row.id),
    }), [handleSelectRow, handleSelectAll, selectedRows])

    const handleClearListSelectedRow = useCallback(() => {
        setSelectedRows([])
    }, [])

    const sortedPayments = useMemo(() => {
        if (!lastTestingPosReceipt || !payments) return payments

        const sortedObjs = [...payments]
        const highlightedIndex = sortedObjs.findIndex(obj => obj.id === lastTestingPosReceipt.condoPaymentId)

        if (highlightedIndex > 0) {
            const [highlightedRow] = sortedObjs.splice(highlightedIndex, 1)
            sortedObjs.unshift(highlightedRow)
        }

        return sortedObjs
    }, [payments, lastTestingPosReceipt])

    return (
        <TablePageContent>
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Row gutter={[0, 24]}>
                        <Col span={24}>
                            <TableFiltersContainer>
                                <Row gutter={ROW_GUTTERS} justify='start' align='middle'>
                                    <Col span={24}>
                                        <Input
                                            placeholder={SearchPlaceholder}
                                            onChange={handleSearch}
                                            value={search}
                                            allowClear
                                            suffix={<Search size='medium' color={colors.gray[7]} />}
                                        />
                                    </Col>
                                    <Col span={!breakpoints.TABLET_SMALL && 24}>
                                        <DateRangePicker
                                            style={!breakpoints.TABLET_SMALL ? { width: '100%' } : null}
                                            value={dateRange}
                                            onChange={setDateRange}
                                            allowClear
                                            disabledDate={disabledDate}
                                            defaultValue={[dayjs().subtract(7, 'days'), dayjs()]}
                                        />
                                    </Col>
                                    <Col style={QUICK_FILTERS_COL_STYLE}>
                                        <Checkbox
                                            checked={showPaymentsOnlyInDoneStatus}
                                            onChange={switchShowPaymentsOnlyInDoneStatus}
                                            children={PaymentsOnlyInDoneStatusMessage}
                                        />
                                    </Col>
                                </Row>
                            </TableFiltersContainer>
                        </Col>
                        <Col span={24}>
                            <PaymentsSumTable>
                                <Row justify='center' gutter={SUM_BAR_COL_GUTTER}>
                                    <Col>
                                        <MarketplacePaymentsSumInfo
                                            title={AllPaymentsSumMessage}
                                            message={get(allPaymentsSum, 'result.sum', 0)}
                                            loading={allPaymentsSumLoading}
                                        />
                                    </Col>
                                    <Col>
                                        <MarketplacePaymentsSumInfo
                                            title={DonePaymentsSumMessage}
                                            message={get(donePaymentsSum, 'result.sum', 0)}
                                            type='success'
                                            loading={donePaymentsSumLoading}
                                        />
                                    </Col>
                                    <Col>
                                        <MarketplacePaymentsSumInfo
                                            title={WithdrawnPaymentsSumMessage}
                                            message={get(withdrawnPaymentsSum, 'result.sum', 0)}
                                            type='warning'
                                            loading={withdrawnPaymentsSumLoading}
                                        />
                                    </Col>
                                </Row>
                            </PaymentsSumTable>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Row
                        gutter={ROW_GUTTERS}
                        align='middle'
                        justify='center'
                    >
                        <Col span={24}>
                            <Table
                                totalRows={total}
                                loading={paymentsLoading || isLastTestingPosReceiptLoading}
                                dataSource={sortedPayments}
                                columns={tableColumns}
                                rowSelection={rowSelection}
                                onRow={(record) => {
                                    if (lastTestingPosReceipt && lastTestingPosReceipt?.condoPaymentId === record.id) {
                                        return { style: { backgroundColor: colors.orange[1] } }
                                    }
                                }}
                            />
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Modal
                open={isStatusDescModalVisible}
                onCancel={() => setIsStatusDescModalVisible(false)}
                title={titleStatusDescModal}
                footer={[
                    <Button
                        key='close'
                        type='secondary'
                        onClick={() => setIsStatusDescModalVisible(false)}
                    >
                        {ConfirmTitle}
                    </Button>,
                ]}
            >
                <Typography.Text type='secondary'>
                    {textStatusDescModal}
                </Typography.Text>
            </Modal>
            <ExportToExcelActionBar
                key='exportToExcel'
                searchObjectsQuery={{
                    ...searchPaymentsQuery,
                    ...filtersToWhere(filters),
                }}
                sortBy={sortBy}
                exportToExcelQuery={EXPORT_PAYMENTS_TO_EXCEL}
                disabled={total < 1}
                actions={[
                    selectedRows.length > 0 ? <Button
                        key='clearListSelectedRow'
                        type='primary'
                        onClick={handleClearListSelectedRow}
                    >
                        {ClearListSelectedRowMessage}
                    </Button> : undefined,
                ]}
            />
        </TablePageContent>
    )
}

export const MarketplacePaymentsContent = () => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.marketplace.payments.empty.text' })
    const EmptyListTitle = intl.formatMessage({ id: 'pages.condo.marketplace.payments.empty.title' })

    const userOrganization = useOrganization()
    const orgId = get(userOrganization, ['organization', 'id'], null)
    const role = get(userOrganization, ['link', 'role'], {})
    const canReadPayments = get(role, 'canReadPaymentsWithInvoices', false)

    const { count, loading } = Payment.useCount({
        where: {
            invoice: {
                organization: { id: orgId },
            },
            status_in: [PaymentStatusType.Withdrawn, PaymentStatusType.Done],
        },
    })

    if (loading) {
        return <Loader />
    }

    if (count === 0) {
        return (
            <EmptyListContent
                label={EmptyListTitle}
                message={EmptyListLabel}
                accessCheck={canReadPayments}
            />
        )
    }

    return <MarketplacePaymentsTable />
}
