import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tag, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'
import { useBreakpoints } from '@open-condo/ui/dist/hooks'

import { PaymentsSumTable as RequisitesContainer } from '@condo/domains/acquiring/components/payments/PaymentsSumTable'

import type { BankAccount as BankAccountType } from '@app/condo/schema'


const GUTTER: [Gutter, Gutter] = [0, 20]
const valueAlign: React.CSSProperties = { textAlign: 'end' }
const renderRow = (name, value) => {
    return (
        <Row gutter={GUTTER}>
            <Col span={10}>
                <Typography.Text type='secondary' size='large'>{name}</Typography.Text>
            </Col>
            <Col span={14} style={valueAlign}>
                <Typography.Text type='secondary' size='large'>{value}</Typography.Text>
            </Col>
        </Row>
    )
}

export interface IBankAccountInfo {
    bankAccount: BankAccountType
}

export const BankingInfo: React.FC<IBankAccountInfo> = ({ bankAccount }) => {
    const intl = useIntl()
    const TinMessage = intl.formatMessage({ id: 'pages.condo.settings.bankAccountInfo.tin' })
    const NumberMessage = intl.formatMessage({ id: 'pages.condo.settings.bankAccountInfo.number' })
    const BicMessage = intl.formatMessage({ id: 'pages.condo.settings.bankAccountInfo.bic' })
    const accrualsAndPayments = intl.formatMessage({ id: 'global.section.accrualsAndPayments' })

    const breakpoints = useBreakpoints()

    const containerStyle = useMemo(() => {
        return { width: breakpoints.MOBILE_SMALL && !breakpoints.DESKTOP_LARGE ? '100%' : '425px' }
    }, [breakpoints])

    return (
        <RequisitesContainer style={containerStyle}>
            <Tag
                bgColor={ colors.gray[7]}
                textColor={colors.white}
            >
                {accrualsAndPayments}
            </Tag>
            <Row gutter={GUTTER}>
                <Typography.Title level={3}>{get(bankAccount, 'organization.name', '-')}</Typography.Title>
            </Row>

            {renderRow(TinMessage, get(bankAccount, 'tin', '-'))}
            {renderRow(BicMessage, get(bankAccount, 'routingNumber', '-'))}
            {renderRow(NumberMessage, get(bankAccount, 'number', '-'))}
        </RequisitesContainer>
    )
}
