import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Link from 'next/link'
import React, { CSSProperties, useMemo } from 'react'

import { useIntl } from '@core/next/intl'

import { colors } from '@condo/domains/common/constants/style'
import { TicketHint, TicketHintProperty } from '@condo/domains/ticket/utils/clientSchema'

import { TicketHintContent } from './TicketHintContent'
import { get } from 'lodash'

const ROW_STYLES: CSSProperties = { overflow: 'hidden', backgroundColor: colors.backgroundLightGrey, padding: '20px', borderRadius: '12px' }
const LINK_STYLES: CSSProperties = { color: 'black', position: 'relative', bottom: '-8px' }

const GUTTER_0_10: [Gutter, Gutter] = [0, 10]

export const FormTicketHintCard = ({ selectedPropertyId }) => {
    const intl = useIntl()
    const HintMessage = intl.formatMessage({ id: 'Hint' })
    const ExtraTitleMessage = intl.formatMessage({ id: 'component.statscard.ExtraTitle' })

    const { obj: ticketHintProperty } = TicketHintProperty.useObject({
        where: {
            property: { id: selectedPropertyId },
        },
    })
    const ticketHintId = useMemo(() => get(ticketHintProperty, ['ticketHint', 'id'], null), [ticketHintProperty])

    const { obj: ticketHint } = TicketHint.useObject({
        where: {
            id: ticketHintId,
        },
    })

    return selectedPropertyId && ticketHintProperty && ticketHint && (
        <Row gutter={GUTTER_0_10} style={ROW_STYLES}>
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