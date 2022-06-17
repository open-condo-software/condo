import { Col, Row, Typography } from 'antd'
import { get } from 'lodash'
import Link from 'next/link'
import React from 'react'
import { TicketHint } from '../../utils/clientSchema'

export const CreateTicketHint = ({ selectedPropertyId }) => {
    const { loading: ticketHintLoading, obj: ticketHint } = TicketHint.useObject({
        where: {
            properties_some: { id: selectedPropertyId },
        },
    })

    return selectedPropertyId && !ticketHintLoading && (
        <Row gutter={[0, 20]} style={{ position: 'absolute', overflow: 'hidden', backgroundColor: '#F2F3F7', padding: '10px', borderRadius: '12px' }}>
            <Col span={24}>
                <Typography.Title level={5}>Справка</Typography.Title>
            </Col>
            <Col span={24}>
                <div
                    dangerouslySetInnerHTML={{
                        __html: get(ticketHint, 'content'),
                    }}
                    style={{ maxHeight: '280px', maxWidth: '200px', overflow: 'hidden',  wordBreak: 'break-word' }}
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