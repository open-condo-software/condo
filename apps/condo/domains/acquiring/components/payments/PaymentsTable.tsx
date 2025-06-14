import { PaymentStatusType, SortPaymentsBy } from '@app/condo/schema'
import { Col, Row, Space } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import dayjs, { Dayjs } from 'dayjs'
import { get } from 'lodash'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import { Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Modal, Typography, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { PaymentsSumTable } from '@condo/domains/acquiring/components/payments/PaymentsSumTable'
import { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } from '@condo/domains/acquiring/constants/payment'
import { EXPORT_PAYMENTS_TO_EXCEL } from '@condo/domains/acquiring/gql'
import usePaymentsSum from '@condo/domains/acquiring/hooks/usePaymentsSum'
import { usePaymentsTableColumns } from '@condo/domains/acquiring/hooks/usePaymentsTableColumns'
import { usePaymentsTableFilters } from '@condo/domains/acquiring/hooks/usePaymentsTableFilters'
import { Payment, PaymentsFilterTemplate } from '@condo/domains/acquiring/utils/clientSchema'
import { IFilters } from '@condo/domains/acquiring/utils/helpers'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import Input from '@condo/domains/common/components/antd/Input'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { getMoneyRender } from '@condo/domains/common/components/Table/Renders'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import {
    MultipleFilterContextProvider,
    useMultipleFiltersModal,
} from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'

const { publicRuntimeConfig: { defaultCurrencyCode } } = getConfig()

const SORTABLE_PROPERTIES = ['advancedAt', 'amount']
const PAYMENTS_DEFAULT_SORT_BY = ['advancedAt_DESC']
const DEFAULT_DATE_RANGE: [Dayjs, Dayjs] = [dayjs().subtract(1, 'week'), dayjs()]

const ROW_GUTTER: [Gutter, Gutter] = [0, 30]
const TAP_BAR_ROW_GUTTER: [Gutter, Gutter] = [0, 20]
const SUM_BAR_COL_GUTTER: [Gutter, Gutter] = [40, 0]
const DATE_PICKER_COL_LAYOUT = { span: 11, offset: 1 }

interface IPaymentsSumInfoProps {
    title: string
    message: string
    currencyCode: string
    type?:  'success' | 'warning'
    loading: boolean
}

export const PaymentsSumInfo: React.FC<IPaymentsSumInfoProps> = ({
    title,
    message,
    currencyCode = defaultCurrencyCode,
    type,
    loading,
}) => {
    const intl = useIntl()

    return (
        <Space direction='horizontal' size={10}>
            <Typography.Text type='secondary'>{title}</Typography.Text>
            <Typography.Text
                {...{ type }}
                strong={true}
            >
                {loading ? '…' : getMoneyRender(intl, currencyCode)(message)}
            </Typography.Text>
        </Space>
    )
}


const PaymentsTableContent: React.FC = (): JSX.Element => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const ConfirmTitle = intl.formatMessage({ id: 'component.TicketWarningModal.ConfirmTitle' })
    const TotalsSumTitle = intl.formatMessage({ id: 'pages.condo.payments.TotalSum' })
    const DoneSumTitle = intl.formatMessage({ id: 'MultiPayment.status.DONE' })
    const WithdrawnSumTitle = intl.formatMessage({ id: 'MultiPayment.status.PROCESSING' })

    const { billingContexts } = useBillingAndAcquiringContexts()
    const billingContext = billingContexts[0]

    const { breakpoints } = useLayoutContext()
    const router = useRouter()
    const userOrganization = useOrganization()

    const { filters, sorters, offset } = parseQuery(router.query)

    // TODO(dkovyazin): DOMA-11394 find out why acquiring uses currency from billing integration
    const currencyCode = get(billingContext, ['integration', 'currencyCode'], defaultCurrencyCode)

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

    const tableColumns = usePaymentsTableColumns(currencyCode, openStatusDescModal)

    const organizationId = get(userOrganization, ['organization', 'id'], '')
    const queryMetas = usePaymentsTableFilters(organizationId)

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, SORTABLE_PROPERTIES)

    const [filtersAreReset, setFiltersAreReset] = useState(false)
    const dateFallback = filtersAreReset ? null : DEFAULT_DATE_RANGE
    const [dateRange, setDateRange] = useDateRangeSearch('depositedDate')
    const dateFilterValue = dateRange || dateFallback
    const dateFilter = dateFilterValue ? dateFilterValue.map(el => el.toISOString()) : null


    const searchPaymentsQuery: Record<string, unknown> = {
        ...filtersToWhere({ depositedDate: dateFilter, ...filters }),
        organization: { id: organizationId },
        status_in: [PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS],
        invoice_is_null: true,
    }
    const sortBy = sortersToSortBy(sorters, PAYMENTS_DEFAULT_SORT_BY)

    const {
        loading,
        count,
        objs,
    } = Payment.useObjects({
        where: searchPaymentsQuery,
        sortBy: sortBy as SortPaymentsBy[],
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const { data: sumDonePayments, loading: donePaymentsLoading } = usePaymentsSum({ paymentsWhere: { ...searchPaymentsQuery, status: PaymentStatusType.Done } })
    const { data: sumWithdrawnPayments, loading: withdrawnPaymentsLoading } = usePaymentsSum({ paymentsWhere: { ...searchPaymentsQuery, status: PaymentStatusType.Withdrawn } })
    const { data: sumAllPayments, loading: allPaymentsLoading } = usePaymentsSum({ paymentsWhere: searchPaymentsQuery })

    const [search, handleSearchChange, handleResetSearch] = useSearch<IFilters>()
    const handleDateChange = useCallback((value) => {
        if (!value) {
            setFiltersAreReset(true)
        }
        setDateRange(value)
    }, [setDateRange])


    const onReset = useCallback(() => {
        setFiltersAreReset(true)
    }, [])

    const {
        MultipleFiltersModal,
        ResetFiltersModalButton,
        OpenFiltersButton,
        appliedFiltersCount,
    } = useMultipleFiltersModal({
        filterMetas: queryMetas,
        filtersSchemaGql: PaymentsFilterTemplate,
        onReset: handleResetSearch,
        extraQueryParameters: { tab: 'payments', type: 'list' },
    })

    return (
        <>
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
                            <Col offset={breakpoints.DESKTOP_SMALL && 1}>
                                <Row justify='end' align='middle'>
                                    {
                                        appliedFiltersCount > 0 && (
                                            <Col onClick={onReset}>
                                                <ResetFiltersModalButton />
                                            </Col>
                                        )
                                    }
                                    <Col>
                                        <OpenFiltersButton />
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
                                    message={get(sumAllPayments, 'result.sum')}
                                    currencyCode={currencyCode}
                                    loading={allPaymentsLoading}
                                />
                            </Col>
                            <Col>
                                <PaymentsSumInfo
                                    title={DoneSumTitle}
                                    message={get(sumDonePayments, 'result.sum')}
                                    currencyCode={currencyCode}
                                    type='success'
                                    loading={donePaymentsLoading}
                                />
                            </Col>
                            <Col>
                                <PaymentsSumInfo
                                    title={WithdrawnSumTitle}
                                    message={get(sumWithdrawnPayments, 'result.sum')}
                                    currencyCode={currencyCode}
                                    type='warning'
                                    loading={withdrawnPaymentsLoading}
                                />
                            </Col>
                        </Row>
                    </PaymentsSumTable>
                </Col>

                <Col span={24}>
                    <Table
                        loading={loading}
                        dataSource={objs}
                        totalRows={count}
                        columns={tableColumns}
                    />
                </Col>
                <Col span={24}>
                    <ExportToExcelActionBar
                        hidden={!breakpoints.TABLET_LARGE}
                        searchObjectsQuery={searchPaymentsQuery}
                        sortBy={sortBy}
                        exportToExcelQuery={EXPORT_PAYMENTS_TO_EXCEL}
                        disabled={count < 1}
                    />
                </Col>
            </Row>

            <Modal
                open={isStatusDescModalVisible}
                onCancel={() => setIsStatusDescModalVisible(false)}
                title={titleStatusDescModal}
                footer={[
                    <Button
                        key='close'
                        type='primary'
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

            <MultipleFiltersModal />
        </>
    )
}

const PaymentsTable: React.FC = (props) => {
    return (
        <MultipleFilterContextProvider>
            <PaymentsTableContent {...props} />
        </MultipleFilterContextProvider>
    )
}

export default PaymentsTable
