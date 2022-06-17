import { Col, Row, Typography } from 'antd'
import Link from 'next/link'
import React, { CSSProperties } from 'react'

import { useIntl } from '@core/next/intl'

import { colors } from '@condo/domains/common/constants/style'
import { TicketHint } from '@condo/domains/ticket/utils/clientSchema'

import { TicketHintContent } from './TicketHintContent'

const ROW_STYLES: CSSProperties = { position: 'absolute', overflow: 'hidden', backgroundColor: colors.backgroundLightGrey, padding: '20px', borderRadius: '12px' }
const LINK_STYLES: CSSProperties = { color: 'black' }

export const CreateTicketHint = ({ selectedPropertyId }) => {
    const intl = useIntl()
    const HintMessage = intl.formatMessage({ id: 'Hint' })
    const ExtraTitleMessage = intl.formatMessage({ id: 'component.statscard.ExtraTitle' })

    const { obj: ticketHint } = TicketHint.useObject({
        where: {
            properties_some: { id: selectedPropertyId },
        },
    })

    return selectedPropertyId && ticketHint && (
        <Row gutter={[0, 20]} style={ROW_STYLES}>
            <Col span={24}>
                <Typography.Title level={5}>{HintMessage}</Typography.Title>
            </Col>
            <Col span={24}>
                <TicketHintContent ticketHint={ticketHint} />
                <Link href={`/property/${selectedPropertyId}/hint`} passHref>
                    <a target={'_blank'}>
                        <Typography.Link underline style={LINK_STYLES}>
                            {ExtraTitleMessage}
                        </Typography.Link>
                    </a>
                </Link>
            </Col>
        </Row>
    )
}