import { useIntl } from '@core/next/intl'
import { Row, Col, Typography } from 'antd'
import React, { CSSProperties } from 'react'


const RECIPIENT_TITLE_CSS: CSSProperties = { fontSize: '20px', fontWeight: 700 }
const RECIPIENT_TEXT_CSS: CSSProperties = { fontSize: '16px' }

const DISPLAYED_RECIPIENT = ['tin', 'iec', 'bic', 'bankAccount']

const RecipientRow = ({ recipientKey, recipientValue, styleText = RECIPIENT_TEXT_CSS }) => {
    const intl = useIntl()
    const recipientTitle = intl.formatMessage({ id: 'pages.condo.settings.recipient.' + recipientKey })

    return (
        <>
            <Col span={6}>
                <Typography.Text style={styleText}>{recipientTitle}</Typography.Text>
            </Col>
            <Col span={18}>
                <Typography.Text style={styleText}>{recipientValue}</Typography.Text>
            </Col>
        </>
    )
}

export const Recipient = ({ recipient }) => {

    return (
        <Col span={24}>
            <Row gutter={[0, 24]}>
                <RecipientRow
                    recipientKey={'name'}
                    recipientValue={recipient.name}
                    styleText={RECIPIENT_TITLE_CSS}
                />

                {
                    DISPLAYED_RECIPIENT.map( (recipientName, index) => {
                        return (
                            <RecipientRow
                                recipientKey={recipientName}
                                recipientValue={recipient[recipientName]}
                                key={index}
                            />
                        )
                    })
                }
            </Row>
        </Col>
    )
}
