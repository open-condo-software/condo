import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Link from 'next/link'
import React, { CSSProperties, useMemo } from 'react'

import { useIntl } from '@core/next/intl'

import { colors } from '@condo/domains/common/constants/style'
import { TicketPropertyHint, TicketPropertyHintProperty } from '@condo/domains/ticket/utils/clientSchema'

import { TicketPropertyHintContent } from './TicketPropertyHintContent'
import { get } from 'lodash'

const ROW_STYLES: CSSProperties = { overflow: 'hidden', backgroundColor: colors.backgroundLightGrey, padding: '20px', borderRadius: '12px' }
const LINK_STYLES: CSSProperties = { color: 'black', position: 'relative', bottom: '-8px' }

const SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 10]

export const FormTicketPropertyHintCard = ({ selectedPropertyId }) => {
    const intl = useIntl()
    const HintMessage = intl.formatMessage({ id: 'Hint' })
    const ExtraTitleMessage = intl.formatMessage({ id: 'component.statscard.ExtraTitle' })

    const { obj: ticketPropertyHintProperty } = TicketPropertyHintProperty.useObject({
        where: {
            property: { id: selectedPropertyId },
        },
    })
    const ticketPropertyHintId = useMemo(() => get(ticketPropertyHintProperty, ['ticketPropertyHint', 'id'], null), [ticketPropertyHintProperty])

    const { obj: ticketPropertyHint } = TicketPropertyHint.useObject({
        where: {
            id: ticketPropertyHintId,
        },
    })

    return selectedPropertyId && ticketPropertyHintProperty && ticketPropertyHint && (
        <Row gutter={SMALL_VERTICAL_GUTTER} style={ROW_STYLES}>
            <Col span={24}>
                <Typography.Title level={5}>{HintMessage}</Typography.Title>
            </Col>
            <Col span={24}>
                <TicketPropertyHintContent ticketPropertyHint={ticketPropertyHint} />
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