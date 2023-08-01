import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

const DISPLAYED_BANK_ACCOUNT = ['tin', 'routingNumber', 'number']

const VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]

const BankAccountRow = ({ bankAccountName, bankAccountValue, title = false }) => {
    const intl = useIntl()
    const recipientTitle = intl.formatMessage({ id: 'pages.condo.settings.bankAccount.' + bankAccountName })

    return (
        <>
            <Col span={6}>
                {title 
                    ? <Typography.Title level={3}>{recipientTitle}</Typography.Title> 
                    : <Typography.Text size='large'>{recipientTitle}</Typography.Text>
                }
            </Col>
            <Col span={18}>
                {title 
                    ? <Typography.Title level={3}>{bankAccountValue}</Typography.Title> 
                    : <Typography.Text size='large'>{bankAccountValue}</Typography.Text>
                }
            </Col>
        </>
    )
}

export const BankAccountInfo = ({ bankAccount, organizationName }) => {

    return (
        <Col span={24}>
            <Row gutter={VERTICAL_GUTTER}>
                <BankAccountRow
                    bankAccountName='name'
                    bankAccountValue={organizationName}
                    title={true}
                />

                {
                    DISPLAYED_BANK_ACCOUNT.map( (recipientName, index) => {
                        return (
                            <BankAccountRow
                                bankAccountName={recipientName}
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
