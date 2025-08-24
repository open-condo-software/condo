import { BillingReceipt } from '@app/condo/schema'
import { css, Global } from '@emotion/react'
import styled from '@emotion/styled'
import { Typography, Space, Table, Row, Col } from 'antd'
import get from 'lodash/get'
import React, { useMemo, useState } from 'react'

import { PlusCircle, MinusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Modal } from '@open-condo/ui'

import { useServicesTableColumns } from '@condo/domains/billing/hooks/useServicesTableColumns'
import { TableRecord } from '@condo/domains/common/components/Table/Index'
import { getMoneyRender } from '@condo/domains/common/components/Table/Renders'
import { colors } from '@condo/domains/common/constants/style'

interface IServicesModalProps {
    receipt: BillingReceipt
    currencyCode: string
    isDetailed: boolean
    visible: boolean
    onCancel: () => void
}

const splitServices = (receipt: BillingReceipt) => {
    const services = get(receipt, 'services', [])
    const significantServices: Array<TableRecord> = []
    const insignificantServices: Array<TableRecord> = []
    if (!services || !services.length) return {
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

const ExpandIconWrapper = styled.div`
    font-size: 20px;
    margin-right: 12px;
    width: 20px;
    color: ${colors.green[6]};
    transform: translateY(2px);
    display: inline-block;
`

const WideModalStyles = css`
    .services-modal {
        width: fit-content !important;
        & > .ant-modal-content > .ant-modal-body {
            width: min-content;
        }
        & > .ant-modal-content > .ant-modal-header > .ant-modal-title {
          line-height: 20px;
        }
    }
`

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
    receipt,
    currencyCode,
    isDetailed,
}) => {
    const intl = useIntl()
    const AccountMessage = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const ViewPDFButton = intl.formatMessage({ id: 'pages.billing.ReceiptsTable.PDFTooltip' })

    const moneyRender = useMemo(() => {
        return getMoneyRender(intl, currencyCode)
    }, [currencyCode, intl])

    const accountNumber = get(receipt, ['account', 'number'])
    const address = get(receipt, ['property', 'address'])
    const unitName = get(receipt, ['account', 'unitName'])
    const unitType = get(receipt, ['account', 'unitType'])
    const fullName = get(receipt, ['account', 'fullName'])
    const period = get(receipt, 'period')
    const pfdUrl = get(receipt, 'file.file.publicUrl')
    const category = get(receipt, ['category', 'nameNonLocalized'])
    const services = get(receipt, 'services', [])

    const UnitTypePrefix = unitType
        ? intl.formatMessage({ id: `field.UnitType.prefix.${unitType.toLowerCase()}` as FormatjsIntl.Message['ids'] }).toLocaleLowerCase()
        : ''
    const CategoryName = category
        ? intl.formatMessage({ id: category as FormatjsIntl.Message['ids'] })
        : ''

    const modalTitleMessage = `${AccountMessage} ${accountNumber}`

    const columns = useServicesTableColumns(isDetailed, currencyCode)

    const { significantServices, insignificantServices } = splitServices(receipt)
    const ExpandMessage = intl.formatMessage({ id: 'MoreReceiptsWithZeroCharge' }, {
        count: insignificantServices.length,
    })
    const dataSource = formatRows(significantServices, insignificantServices, ExpandMessage)

    const [expanded, setExpanded] = useState(false)
    const handleRowExpand = () => setExpanded(!expanded)

    const ModalFooter = () => {
        return (
            <Row justify='end'>
                <Col span={24}>
                    <Button disabled={!pfdUrl} onClick={() => window.open(pfdUrl)} type='primary'>
                        {ViewPDFButton}
                    </Button>
                </Col>
            </Row>
        )
    }

    if (!services || !services.length) return null

    // TODO (savelevMatthew): Move modal to common width-expandable component?
    return (
        <>
            {isDetailed && <Global styles={WideModalStyles}/>}
            <Modal
                open={visible}
                onCancel={() => {
                    setExpanded(false)
                    onCancel()
                }}
                footer={<ModalFooter />}
                className='services-modal'
                title={modalTitleMessage}
            >
                <Row gutter={[0, 20]}>
                    <Col span={24}>
                        <Space direction='vertical' size={4}>
                            <Typography.Paragraph strong type='secondary'>
                                {address}{unitName ? `, ${UnitTypePrefix}. ${unitName}` : ''}
                            </Typography.Paragraph>
                            {fullName && <Typography.Paragraph strong type='secondary'>{fullName}</Typography.Paragraph>}
                            {category && <Typography.Paragraph strong type='secondary'>{CategoryName}</Typography.Paragraph>}
                            {period && <Typography.Paragraph strong type='secondary'>{period}</Typography.Paragraph>}
                        </Space>
                    </Col>
                    <Col span={24}>
                        <Table
                            bordered
                            tableLayout='auto'
                            columns={columns}
                            dataSource={dataSource}
                            pagination={false}
                            expandable={{
                                indentSize: 0,
                                // eslint-disable-next-line react/display-name
                                expandIcon: ({ expanded, onExpand, record }) => {
                                    if (record.name !== ExpandMessage) return
                                    if (expanded) return (
                                        <ExpandIconWrapper>
                                            <MinusCircle onClick={(e) => onExpand(record, e)}/>
                                        </ExpandIconWrapper>
                                    )
                                    return (
                                        <ExpandIconWrapper>
                                            <PlusCircle onClick={(e) => onExpand(record, e)}/>
                                        </ExpandIconWrapper>
                                    )
                                },
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
                                        <Table.Summary.Cell index={0} align='right' colSpan={columns.length}>
                                            <Typography.Text strong>
                                                {moneyRender(pointedNumber)}
                                            </Typography.Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                )
                            }}
                        />
                    </Col>
                </Row>
            </Modal>
        </>
    )
}