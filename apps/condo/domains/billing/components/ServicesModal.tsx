import React, { useContext, useMemo, useState } from 'react'
import { Modal, Typography, Space, Table, ConfigProvider } from 'antd'
import { IBillingReceiptUIState } from '../utils/clientSchema/BillingReceipt'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
import { useServicesTableColumns } from '@condo/domains/billing/hooks/useServicesTableColumns'
import { getMoneyRender } from '@condo/domains/common/components/Table/Renders'
import { TableRecord } from '@condo/domains/common/components/Table/Index'
import { SubText } from '@condo/domains/common/components/Text'
import { SizeType } from 'antd/es/config-provider/SizeContext'
import { PlusSquareOutlined, MinusSquareOutlined } from '@ant-design/icons'
import { css, Global } from '@emotion/react'
import styled from '@emotion/styled'
import { colors } from '@condo/domains/common/constants/style'

interface IServicesModalProps {
    receipt: IBillingReceiptUIState
    currencyCode: string
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
    onOk,
    receipt,
    currencyCode,
    isDetailed,
}) => {
    const intl = useIntl()
    const AccountMessage = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const ShortFlatNumber = intl.formatMessage({ id: 'field.ShortFlatNumber' })

    const moneyRender = useMemo(() => {
        return getMoneyRender(intl, currencyCode)
    }, [currencyCode])

    const accountNumber = get(receipt, ['account', 'number'])
    const address = get(receipt, ['property', 'address'])
    const unitName = get(receipt, ['account', 'unitName'])

    const configSize = useContext<SizeType>(ConfigProvider.SizeContext)
    
    const modalTitleMessage = `${AccountMessage} ${accountNumber}`
    const title = (
        <Space direction={'vertical'} size={4}>
            <Typography.Title level={3}>
                {modalTitleMessage}
            </Typography.Title>
            <SubText size={configSize}>
                {address}{unitName ? `, ${ShortFlatNumber} ${unitName}` : ''}
            </SubText>
        </Space>
    )

    const columns = useServicesTableColumns(isDetailed, currencyCode)

    const { significantServices, insignificantServices } = splitServices(receipt)
    const ExpandMessage = intl.formatMessage({ id: 'MoreReceiptsWithZeroCharge' }, {
        count: insignificantServices.length,
    })
    const dataSource = formatRows(significantServices, insignificantServices, ExpandMessage)

    const [expanded, setExpanded] = useState(false)
    const handleRowExpand = () => setExpanded(!expanded)
    // TODO (savelevMatthew): Move modal to common width-expandable component?
    return (
        <>
            {isDetailed && <Global styles={WideModalStyles}/>}
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
                className={'services-modal'}
                style={{ marginTop:40 }}
            >
                <Table
                    bordered
                    tableLayout={'auto'}
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
                                    <MinusSquareOutlined onClick={(e) => onExpand(record, e)}/>
                                </ExpandIconWrapper>
                            )
                            return (
                                <ExpandIconWrapper>
                                    <PlusSquareOutlined onClick={(e) => onExpand(record, e)}/>
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
        </>
    )
}