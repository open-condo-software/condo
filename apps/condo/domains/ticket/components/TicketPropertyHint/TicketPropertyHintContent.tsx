import { Col, Row, RowProps } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { HtmlContent, HtmlContentProps } from '@condo/domains/common/components/HtmlContent'

type TicketPropertyHintContentProps = HtmlContentProps & {
    linkToHint?: string
}

const CONTENT_GUTTER: RowProps['gutter'] = [0, 14]

export const TicketPropertyHintContent = (props: TicketPropertyHintContentProps) => {
    const intl = useIntl()
    const ExtraTitleMessage = intl.formatMessage({ id: 'component.statscard.ExtraTitle' })

    const ref = React.createRef<HTMLDivElement>()
    const [isContentOverflow, setIsContentOverflow] = React.useState(false)

    React.useLayoutEffect(() => {
        if (ref.current) {
            setIsContentOverflow(ref.current.clientHeight + 10 < ref.current.scrollHeight)
        }
    }, [ref])

    return (
        <>
            <Row gutter={CONTENT_GUTTER}>
                <Col span={24}>
                    <HtmlContent {...props} ref={ref}/>
                </Col>
                {
                    isContentOverflow && props.linkToHint && (
                        <Col span={24}>
                            <Typography.Link href={props.linkToHint} size='large' target='_blank' rel='noreferrer'>
                                {ExtraTitleMessage}
                            </Typography.Link>
                        </Col>
                    )
                }
            </Row>
        </>
    )
}