import { Col, Row, Typography } from 'antd'
import { get } from 'lodash'
import Link from 'next/link'
import React from 'react'
import { colors } from '../../../common/constants/style'
import { TicketHint } from '../../utils/clientSchema'

export const CreateTicketHint = ({ selectedPropertyId }) => {
    const { loading: ticketHintLoading, obj: ticketHint } = TicketHint.useObject({
        where: {
            properties_some: { id: selectedPropertyId },
        },
    })

    return selectedPropertyId && ticketHint && (
        <Row gutter={[0, 20]} style={{ position: 'absolute', overflow: 'hidden', backgroundColor: colors.backgroundLightGrey, padding: '20px', borderRadius: '12px' }}>
            <Col span={24}>
                <Typography.Title level={5}>Справка</Typography.Title>
            </Col>
            <Col span={24}>
                <div
                    dangerouslySetInnerHTML={{
                        __html: get(ticketHint, 'content'),
                    }}
                    style={{ maxHeight: '250px', maxWidth: '200px', overflow: 'hidden',  wordBreak: 'break-word' }}
                />
                <Link href={`/property/${selectedPropertyId}/hint`} passHref>
                    <a target={'_blank'}>
                        <Typography.Link underline style={{ color: 'black' }}>
                            Подробнее
                        </Typography.Link>
                    </a>
                </Link>
            </Col>
        </Row>
    )
}