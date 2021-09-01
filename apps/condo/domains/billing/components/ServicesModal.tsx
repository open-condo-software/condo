import React, { useMemo, useState } from 'react'
import { Modal, Typography, Space, Table } from 'antd'
import { IBillingReceiptUIState } from '../utils/clientSchema/BillingReceipt'
import { useIntl } from '@core/next/intl'
import { colors } from '@condo/domains/common/constants/style'
import get from 'lodash/get'
import { useServicesTableColumns } from '@condo/domains/billing/hooks/useServicesTableColumns'
import { getMoneyRender } from '@condo/domains/common/components/Table/Renders'
import { TableRecord } from '@condo/domains/common/components/Table/Index'

interface IServicesModalProps {
    receipt: IBillingReceiptUIState
    currencyMark: string
    currencySeparator: string
    isDetailed: boolean
    visible: boolean
    onOk: () => void
    onCancel: () => void
}

const splitServices = (receipt: IBillingReceiptUIState) => {
    const services = get(receipt, 'services', [])
    const significantServices: Array<TableRecord> = []
    const insignificantServices: Array<TableRecord> = []
    if (!services.length) return {
        significantServices,
        insignificantServices,
    }
    services.forEach((service) => {
        const toPay = parseFloat(get(service, 'toPay', '0'))
        if (toPay === 0) {
            insignificantServices.push(service)
        } else {
            significantServices.push(service)
        }
    })
    return {
        significantServices,
        insignificantServices,
    }
}

const formatRows = (significantServices: Array<TableRecord>, insignificantServices: Array<TableRecord>, expandMessage: string) => {
    if (significantServices.length) {
        if (insignificantServices.length) {
            return [
                ...significantServices,
                {
                    name: expandMessage,
                    children: insignificantServices,
                },
            ]
        }
        return significantServices
    }
    return insignificantServices
}

export const ServicesModal: React.FC<IServicesModalProps> = ({
    visible,
    onCancel,
    onOk,
    receipt,
    currencySeparator,
    currencyMark,
    isDetailed,
}) => {
    const intl = useIntl()
    const AccountMessage = intl.formatMessage({ id: 'field.AccountNumberShort' })

    const moneyRender = useMemo(() => {
        return getMoneyRender(undefined, currencyMark, currencySeparator)
    }, [currencyMark, currencySeparator])

    const accountNumber = get(receipt, ['account', 'number'])
    const address = get(receipt, ['property', 'address'])

    const modalTitleMessage = `${AccountMessage} ${accountNumber}`
    const title = (
        <Space direction={'vertical'} size={4}>
            <Typography.Title level={3}>
                {modalTitleMessage}
            </Typography.Title>
            <Typography.Text style={{ fontSize: 14, color: colors.lightGrey[7] }}>
                {address}
            </Typography.Text>
        </Space>
    )

    const columns = useServicesTableColumns(isDetailed, currencyMark, currencySeparator)

    const { significantServices, insignificantServices } = splitServices(receipt)
    const ExpandMessage = intl.formatMessage({ id: 'MoreReceiptsWithZeroCharge' }, {
        count: insignificantServices.length,
    })
    const dataSource = formatRows(significantServices, insignificantServices, ExpandMessage)

    const [expanded, setExpanded] = useState(false)
    const handleRowExpand = () => setExpanded(!expanded)
    const modalMinWidthStyle = isDetailed ? { minWidth: 1100 } : undefined

    return (
        <Modal
            title={title}
            visible={visible}
            onOk={() => {
                setExpanded(false)
                onOk()
            }}
            onCancel={() => {
                setExpanded(false)
                onCancel()
            }}
            footer={null}
            centered
            style={{ ...modalMinWidthStyle, marginTop: 40 }}
        >
            <Table
                bordered
                tableLayout={'fixed'}
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                expandable={{
                    indentSize: 0,
                }}
                onExpand={handleRowExpand}
                expandedRowKeys={expanded ? [ExpandMessage] : []}
                rowKey={(record) => record.name}
                onRow={(record) => ({
                    onClick: () => {
                        if (record.name === ExpandMessage) {
                            setExpanded(!expanded)
                        }
                    },
                })}
                summary={(pageData) => {
                    let totalToPay = 0
                    pageData.forEach(({ toPay }) => {
                        totalToPay += parseFloat(toPay || '0')
                    })
                    const pointedNumber = totalToPay.toFixed(2)
                    return (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} align={'right'} colSpan={columns.length}>
                                <Typography.Text strong>
                                    {moneyRender(pointedNumber)}
                                </Typography.Text>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    )
                }}
            />
        </Modal>
    )
}