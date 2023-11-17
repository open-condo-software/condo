import { useApolloClient } from '@apollo/client'
import {
    Payment as PaymentType, SortPaymentsBy,
} from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row, RowProps, Typography } from 'antd'
import { TableRowSelection } from 'antd/lib/table/interface'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Modal } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { PAYMENT_PROCESSING_STATUS, PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS, PAYMENT_ERROR_STATUS } from '@condo/domains/acquiring/constants/payment'
import { SUM_PAYMENTS_QUERY } from '@condo/domains/acquiring/gql'
import { Payment } from '@condo/domains/acquiring/utils/clientSchema'
import Input from '@condo/domains/common/components/antd/Input'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import EmptyListView from '@condo/domains/common/components/EmptyListView'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { DEFAULT_BORDER_RADIUS } from '@condo/domains/common/constants/style'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useMarketplacePaymentsFilters } from '@condo/domains/marketplace/hooks/useMarketplacePaymentsFilters'
import { useMarketplacePaymentTableColumns } from '@condo/domains/marketplace/hooks/useMarketplacePaymentTableColumns'


const ROW_GUTTERS: RowProps['gutter'] = [0, 40]
const PaymentsSumContainer = styled.div`
  max-width: calc(100% + 48px);
  border-radius: ${DEFAULT_BORDER_RADIUS};
  border-color: ${colors.gray};
  padding: 16px;
  background-color: ${colors.white};

  &.disabled {
    opacity: 0.5;
    pointer-events: none;  
  }
`

export const MarketplacePaymentsContent = () => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.marketplace.payments.empty.text' })
    const EmptyListTitle = intl.formatMessage({ id: 'pages.condo.marketplace.payments.empty.title' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const ClearListSelectedRowMessage = intl.formatMessage({ id: 'global.cancelSelection' })
    const allPaymentsSumMessage = intl.formatMessage({ id: 'pages.condo.marketplace.payments.stats.allPayment' })
    const donePaymentsSumMessage = intl.formatMessage({ id: 'pages.condo.marketplace.payments.stats.donePayment' })
    const inProcessPaymentsSumMessage = intl.formatMessage({ id: 'pages.condo.marketplace.payments.stats.inProcessPayment' })
    const ConfirmTitle = intl.formatMessage({ id: 'component.TicketWarningModal.ConfirmTitle' })

    const router = useRouter()
    const client = useApolloClient()
    const userOrganization = useOrganization()
    const orgId = get(userOrganization, ['organization', 'id'], null)
    const role = get(userOrganization, ['link', 'role'], {})

    const { filters, offset, sorters } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const canReadPayments = get(role, 'canReadPayments', false)

    const filterMetas = useMarketplacePaymentsFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, [])

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
    const tableColumns = useMarketplacePaymentTableColumns(filterMetas, openStatusDescModal)

    const searchPaymentsQuery = useMemo(() => {
        return {
            invoice: {
                context: {
                    organization: { id: orgId },
                },
            },
        }},
    [filters, filtersToWhere, orgId])
    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortPaymentsBy[], [sorters, sortersToSortBy])
    
    const {
        loading: paymentsLoading,
        count: total,
        objs: payments,
        refetch,
    } = Payment.useObjects({
        sortBy,
        where: searchPaymentsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const [allPaymentsSum, setAllPaymentsSum] = useState(0)
    const [donePaymentsSum, setDonePaymentsSum] = useState(0)
    const [inProcessPaymentsSum, setInProcessPaymentsSum] = useState(0)

    useDeepCompareEffect(() => {
        client.query({
            query: SUM_PAYMENTS_QUERY,
            variables: {
                where: {
                    ...searchPaymentsQuery,
                },
            },
            fetchPolicy: 'network-only',
        }).then((response) => setAllPaymentsSum(get(response, 'data.result.sum', 0)))

        client.query({
            query: SUM_PAYMENTS_QUERY,
            variables: {
                where: {
                    ...searchPaymentsQuery,
                    status: PAYMENT_DONE_STATUS,
                },
            },
            fetchPolicy: 'network-only',
        }).then((response) => setDonePaymentsSum(get(response, 'data.result.sum', 0)))

        client.query({
            query: SUM_PAYMENTS_QUERY,
            variables: {
                where: {
                    ...searchPaymentsQuery,
                    status_in: [PAYMENT_PROCESSING_STATUS, PAYMENT_WITHDRAWN_STATUS, PAYMENT_ERROR_STATUS],
                },
            },
            fetchPolicy: 'network-only',
        }).then((response) => setInProcessPaymentsSum(get(response, 'data.result.sum', 0)))
    }, [])

    const isNoPaymentsData = isEmpty(payments) && isEmpty(filters) && !paymentsLoading

    const [selectedRows, setSelectedRows] = useState([])

    const [search, handleSearchChange] = useSearch()
    const handleSearch = useCallback((e) => {handleSearchChange(e.target.value)}, [handleSearchChange])

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

    return (
        <TablePageContent>
            {
                (paymentsLoading || payments.length === 0) ? <EmptyListView
                    label={EmptyListTitle}
                    message={EmptyListLabel}
                    containerStyle={{ display: isNoPaymentsData ? 'flex' : 'none' }}
                    accessCheck={canReadPayments}
                /> : <>
                    <Col span={24}>
                        <TableFiltersContainer>
                            <Row justify='space-between' gutter={ROW_GUTTERS}>
                                <Col xs={24} lg={7}>
                                    <Input
                                        placeholder={SearchPlaceholder}
                                        onChange={handleSearch}
                                        value={search}
                                        allowClear
                                    />
                                </Col>
                            </Row>
                        </TableFiltersContainer>
                        <PaymentsSumContainer>
                            <Row justify='space-between' gutter={ROW_GUTTERS}>
                                <Col xs={24} lg={7}>
                                    {`${allPaymentsSumMessage}: ${allPaymentsSum}`}
                                </Col>
                                <Col xs={24} lg={7}>
                                    {`${donePaymentsSumMessage}: ${donePaymentsSum}`}
                                </Col>
                                <Col xs={24} lg={7}>
                                    {`${inProcessPaymentsSumMessage}: ${inProcessPaymentsSum}`}
                                </Col>
                            </Row>
                        </PaymentsSumContainer>
                    </Col>
                    <Row
                        gutter={ROW_GUTTERS}
                        align='middle'
                        justify='center'
                        hidden={isNoPaymentsData}
                    >
                        <Col span={24}>
                            <Table
                                totalRows={total}
                                loading={paymentsLoading}
                                dataSource={payments}
                                columns={tableColumns}
                                rowSelection={rowSelection}
                            />
                        </Col>
                    </Row>
                </>
            }

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
            {
                (canReadPayments && !isNoPaymentsData) || selectedRows.length > 0  && (
                    <ActionBar
                        actions={[
                            // TODO after the pdf check and uploading to Excel is ready
                            // <Button
                            //     key='exportToExcel'
                            //     type='primary'
                            //     onClick={handleExcelExportButtonClick}
                            // >
                            //     {ExportToExcelLabel}
                            // </Button>,
                            // <Button
                            //     key='downloadCheck'
                            //     type='primary'
                            //     onClick={handleDownloadCheckButtonClick}
                            // >
                            //     {DownloadCheckLabel}
                            // </Button>,
                            selectedRows.length > 0 ? <Button
                                key='clearListSelectedRow'
                                type='primary'
                                onClick={handleClearListSelectedRow}
                            >
                                {ClearListSelectedRowMessage}
                            </Button> : undefined,
                        ]}
                    />
                )
            }
        </TablePageContent>
    )
}