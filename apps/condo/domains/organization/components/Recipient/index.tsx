import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { fontSizes } from '@condo/domains/common/constants/style'

const RECIPIENT_TITLE_CSS: CSSProperties = { fontSize: fontSizes.large, fontWeight: 700 }
const RECIPIENT_TEXT_CSS: CSSProperties = { fontSize: fontSizes.content }

const DISPLAYED_RECIPIENT = ['tin', 'iec', 'bic', 'bankAccount']

const VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]

const RecipientRow = ({ recipientKey, recipientValue, styleText = RECIPIENT_TEXT_CSS }) => {
    const intl = useIntl()
    const recipientTitle = intl.formatMessage({ id: 'settings.recipient.' + recipientKey })

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
            <Row gutter={VERTICAL_GUTTER}>
                <RecipientRow
                    recipientKey='name'
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
