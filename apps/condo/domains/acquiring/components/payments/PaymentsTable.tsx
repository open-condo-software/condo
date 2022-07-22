import { FilterFilled } from '@ant-design/icons'
import { BillingIntegrationOrganizationContext, SortPaymentsBy } from '@app/condo/schema'
import { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } from '@condo/domains/acquiring/constants/payment'
import { PaymentsSumTable } from '@condo/domains/acquiring/components/payments/PaymentsSumTable'
import { EXPORT_PAYMENTS_TO_EXCEL } from '@condo/domains/acquiring/gql'
import { usePaymentsTableColumns } from '@condo/domains/acquiring/hooks/usePaymentsTableColumns'
import { usePaymentsTableFilters } from '@condo/domains/acquiring/hooks/usePaymentsTableFilters'
import { Payment, PaymentsFilterTemplate } from '@condo/domains/acquiring/utils/clientSchema'
import { IFilters } from '@condo/domains/acquiring/utils/helpers'
import { Button } from '@condo/domains/common/components/Button'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import { useMultipleFiltersModal } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { Col, Row, Modal, Space, Typography } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import { Gutter } from 'antd/lib/grid/row'
import dayjs, { Dayjs } from 'dayjs'
import { get, isEmpty } from 'lodash'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { getMoneyRender } from '@condo/domains/common/components/Table/Renders'

const SORTABLE_PROPERTIES = ['advancedAt', 'amount']
const PAYMENTS_DEFAULT_SORT_BY = ['advancedAt_DESC']
const DEFAULT_CURRENCY_CODE = 'RUB'
const DEFAULT_DATE_RANGE: [Dayjs, Dayjs] = [dayjs().subtract(1, 'week'), dayjs()]
const DEFAULT_DATE_RANGE_STR: [string, string] = [String(DEFAULT_DATE_RANGE[0]), String(DEFAULT_DATE_RANGE[1])]

const ROW_GUTTER: [Gutter, Gutter] = [0, 30]
const TAP_BAR_ROW_GUTTER: [Gutter, Gutter] = [0, 20]
const SUM_BAR_COL_GUTTER: [Gutter, Gutter] = [40, 0]
const DATE_PICKER_COL_LAYOUT = { span: 11, offset: 1 }

/**
 * Next two variables need for keeping data about default filters during component lifetime
 */
let isDefaultFilterApplied = false
let shouldApplyDefaultFilter = true

interface IPaymentsTableProps {
    billingContext: BillingIntegrationOrganizationContext,
    contextsLoading: boolean,
}

interface IPaymentsSumInfoProps {
    title: string
    message: string
    currencyCode: string
    type?:  'success' | 'warning'
}

const PaymentsSumInfo: React.FC<IPaymentsSumInfoProps> = ({
    title,
    message,
    currencyCode = DEFAULT_CURRENCY_CODE,
    type,
}) => {
    const intl = useIntl()

    return (
        <Space direction={'horizontal'} size={10}>
            <Typography.Text type={'secondary'}>{title}</Typography.Text>
            <Typography.Text
                {...{ type }}
                strong={true}
            >
                {getMoneyRender(intl, currencyCode)(message)}
            </Typography.Text>
        </Space>
    )
}

function getSumPerPeriod (objs) {
    let sumAllPayments = 0,
        sumDonePayments = 0,
        sumWithdrawnPayments = 0

    for (const key in objs) {
        sumAllPayments += Number(objs[key].amount)
        if (objs[key].status === PAYMENT_DONE_STATUS)
            sumDonePayments += Number(objs[key].amount)
        else
            sumWithdrawnPayments += Number(objs[key].amount)
    }

    return { sumAllPayments, sumDonePayments, sumWithdrawnPayments }
}

const PaymentsTable: React.FC<IPaymentsTableProps> = ({ billingContext, contextsLoading }): JSX.Element => {
    const intl = useIntl()
    const searchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const filtersButtonLabel = intl.formatMessage({ id: 'FiltersLabel' })
    const startDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const endDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const confirmTitle = intl.formatMessage({ id: 'component.TicketWarningModal.ConfirmTitle' })
    const totalsSumTitle = intl.formatMessage({ id: 'pages.condo.payments.TotalSum' })
    const doneSumTitle = intl.formatMessage({ id: 'MultiPayment.status.DONE' })
    const withdrawnSumTitle = intl.formatMessage({ id: 'MultiPayment.status.PROCESSING' })

    const { isSmall } = useLayoutContext()
    const router = useRouter()
    const userOrganization = useOrganization()

    const { filters, sorters, offset } = parseQuery(router.query)
    const hasFilters = !isEmpty(filters)

    if (hasFilters) {
        shouldApplyDefaultFilter = false
        isDefaultFilterApplied = true
    }

    if (shouldApplyDefaultFilter) {
        filters.advancedAt = DEFAULT_DATE_RANGE_STR
    }

    const appliedFiltersCount = Object.keys(filters).length
    const currencyCode = get(billingContext, ['integration', 'currencyCode'], 'RUB')

    const [isStatusDescModalVisible, setIsStatusDescModalVisible] = useState<boolean>(false)
    const [titleStatusDescModal, setTitleStatusDescModal] = useState('')
    const [textStatusDescModal, setTextStatusDescModal] = useState('')
    const openStatusDescModal = (statusType) => {
        const titleModal = intl.formatMessage({ id: 'payment.status.description.title.' + statusType })
        const textModal = intl.formatMessage({ id: 'payment.status.description.text.' + statusType })

        setTitleStatusDescModal(titleModal)
        setTextStatusDescModal(textModal)
        setIsStatusDescModalVisible(true)
    }

    const tableColumns = usePaymentsTableColumns(currencyCode, openStatusDescModal)

    const organizationId = get(userOrganization, ['organization', 'id'], '')
    const queryMetas = usePaymentsTableFilters(billingContext, organizationId)

    const {
        MultipleFiltersModal,
        ResetFiltersModalButton,
        setIsMultipleFiltersModalVisible,
    } = useMultipleFiltersModal(queryMetas, PaymentsFilterTemplate)

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, SORTABLE_PROPERTIES)

    const searchPaymentsQuery: Record<string, unknown> = {
        ...filtersToWhere(filters),
        organization: { id: organizationId },
        deletedAt: null,
        status_in: [PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS],
    }

    const sortBy = sortersToSortBy(sorters, PAYMENTS_DEFAULT_SORT_BY)

    const {
        loading,
        count,
        objs,
        error,
    } = Payment.useObjects({
        where: searchPaymentsQuery,
        sortBy: sortBy as SortPaymentsBy[],
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const { sumAllPayments, sumDonePayments, sumWithdrawnPayments } = getSumPerPeriod(objs)

    const [search, handleSearchChange] = useSearch<IFilters>(loading)
    const [dateRange, setDateRange] = useDateRangeSearch('advancedAt', loading)

    /**
     * We need to check if default filters should be applied only at first render
     */
    useEffect(() => {
        if (!hasFilters && shouldApplyDefaultFilter && !isDefaultFilterApplied) {
            isDefaultFilterApplied = true
            setDateRange(DEFAULT_DATE_RANGE)
        } else {
            shouldApplyDefaultFilter = false
        }

        return () => {
            isDefaultFilterApplied = false
            shouldApplyDefaultFilter = true
        }
    }, [])

    return (
        <>
            <Row gutter={ROW_GUTTER} align="middle" justify="center">
                <Col span={24}>
                    <TableFiltersContainer>
                        <Row justify="end" gutter={TAP_BAR_ROW_GUTTER}>
                            <Col flex="auto">
                                <Row gutter={TAP_BAR_ROW_GUTTER}>
                                    <Col xs={24} sm={12} lg={8}>
                                        <Input
                                            placeholder={searchPlaceholder}
                                            value={search}
                                            onChange={(e) => {
                                                handleSearchChange(e.target.value)
                                            }}
                                            allowClear
                                        />
                                    </Col>
                                    <Col xs={24} sm={DATE_PICKER_COL_LAYOUT} lg={DATE_PICKER_COL_LAYOUT}>
                                        <DateRangePicker
                                            value={dateRange}
                                            onChange={setDateRange}
                                            placeholder={[startDateMessage, endDateMessage]}
                                        />
                                    </Col>
                                </Row>
                            </Col>

                            <Col offset={1}>
                                <Row justify="end" align="middle">
                                    {
                                        appliedFiltersCount > 0 && (
                                            <Col>
                                                <ResetFiltersModalButton/>
                                            </Col>
                                        )
                                    }
                                    <Col>
                                        <Button
                                            secondary
                                            type="sberPrimary"
                                            onClick={() => setIsMultipleFiltersModalVisible(true)}
                                        >
                                            <FilterFilled/>
                                            {filtersButtonLabel}
                                            {appliedFiltersCount > 0 && ` (${appliedFiltersCount})`}
                                        </Button>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </TableFiltersContainer>
                </Col>

                <Col span={24}>
                    <PaymentsSumTable>
                        <Row justify="center" gutter={SUM_BAR_COL_GUTTER}>
                            <Col>
                                <PaymentsSumInfo
                                    title={totalsSumTitle}
                                    message={String(sumAllPayments)}
                                    currencyCode={currencyCode}
                                />
                            </Col>
                            <Col>
                                <PaymentsSumInfo
                                    title={doneSumTitle}
                                    message={String(sumDonePayments)}
                                    currencyCode={currencyCode}
                                    type={'success'}
                                />
                            </Col>
                            <Col>
                                <PaymentsSumInfo
                                    title={withdrawnSumTitle}
                                    message={String(sumWithdrawnPayments)}
                                    currencyCode={currencyCode}
                                    type={'warning'}
                                />
                            </Col>
                        </Row>
                    </PaymentsSumTable>
                </Col>

                <Col span={24}>
                    <Table
                        loading={loading || contextsLoading}
                        dataSource={objs}
                        totalRows={count}
                        columns={tableColumns}
                    />
                </Col>
                <ExportToExcelActionBar
                    hidden={isSmall}
                    searchObjectsQuery={searchPaymentsQuery}
                    sortBy={sortBy}
                    exportToExcelQuery={EXPORT_PAYMENTS_TO_EXCEL}
                    disabled={count < 1}
                />
            </Row>

            <Modal
                visible={isStatusDescModalVisible}
                onCancel={() => setIsStatusDescModalVisible(false)}
                title={titleStatusDescModal}
                centered
                footer={[
                    <Button
                        key={'close'}
                        type={'sberDefaultGradient'}
                        onClick={() => setIsStatusDescModalVisible(false)}
                    >
                        {confirmTitle}
                    </Button>,
                ]}
            >
                <Typography.Text type={'secondary'}>
                    {textStatusDescModal}
                </Typography.Text>
            </Modal>

            <MultipleFiltersModal/>
        </>
    )
}

export default PaymentsTable
