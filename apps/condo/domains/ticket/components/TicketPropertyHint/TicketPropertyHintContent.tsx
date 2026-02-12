import { Col, Row, RowProps } from 'antd'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Markdown, Typography } from '@open-condo/ui'

type TicketPropertyHintContentProps = {
    content: string
    style?: CSSProperties
    className?: string
    linkToHint?: string
}

const CONTENT_GUTTER: RowProps['gutter'] = [0, 14]
const CONTENT_WRAPPER_STYLES: CSSProperties = {
    overflow: 'hidden',
    wordBreak: 'break-word',
    position: 'relative',
}

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

    const wrapperStyle = React.useMemo(
        () => ({ ...CONTENT_WRAPPER_STYLES, ...props.style }),
        [props.style]
    )

    return (
        <>
            <Row gutter={CONTENT_GUTTER}>
                <Col span={24}>
                    <div ref={ref} style={wrapperStyle} className={props.className}>
                        <Markdown type='inline'>{props.content}</Markdown>
                    </div>
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