import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import type { BankAccount as BankAccountType } from '@app/condo/schema'

const DISPLAYED_BANK_ACCOUNT = ['tin', 'routingNumber', 'number']

const VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]

type BankAccountFieldName = Pick<BankAccountType, 'number' | 'tin' | 'routingNumber'> | 'name'
export interface IBankAccountRowContent {
    bankAccountFieldName: BankAccountFieldName
    bankAccountValue: string
    isTitle?: boolean
}

export interface IBankAccountInfo {
    bankAccount: BankAccountType
}

const BankAccountRowContent: React.FC<IBankAccountRowContent> = ({ bankAccountFieldName, bankAccountValue, isTitle = false }) => {
    const intl = useIntl()
    const recipientTitle = intl.formatMessage({ id: `pages.condo.settings.bankAccount.${bankAccountFieldName}` })

    return (
        <>
            <Col span={6}>
                {isTitle 
                    ? <Typography.Title level={3}>{recipientTitle}</Typography.Title> 
                    : <Typography.Text size='large'>{recipientTitle}</Typography.Text>
                }
            </Col>
            <Col span={18}>
                {isTitle 
                    ? <Typography.Title level={3}>{bankAccountValue}</Typography.Title> 
                    : <Typography.Text size='large'>{bankAccountValue}</Typography.Text>
                }
            </Col>
        </>
    )
}

export const BankAccountInfo: React.FC<IBankAccountInfo> = ({ bankAccount }) => {
    return (
        <Col span={24}>
            <Row gutter={VERTICAL_GUTTER}>
                {
                    DISPLAYED_BANK_ACCOUNT.map( (recipientName, index) => {
                        return (
                            <BankAccountRowContent
                                bankAccountFieldName={recipientName as BankAccountFieldName}
                                bankAccountValue={bankAccount[recipientName]}
                                key={index}
                            />
                        )
                    })
                }
            </Row>
        </Col>
    )
}
