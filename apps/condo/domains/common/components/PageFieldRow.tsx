import React from 'react'
import { Col, Typography } from 'antd'
import { fontSizes } from '@condo/domains/common/constants/style'

const { bodyCopy } = fontSizes

interface IPageFieldRowProps {
    title: string
    highlight?: boolean
    children: React.ReactNode
    labelSpan?: number
}

const PageFieldRow: React.FC<IPageFieldRowProps> = (props) => {
    const { labelSpan = 8, title, children, highlight } = props
    return (
        <>
            <Col span={labelSpan}>
                <Typography.Text style={{ fontSize: bodyCopy }}>{title}</Typography.Text>
            </Col>
            <Col span={24 - labelSpan - 1} push={1} style={{ fontSize: bodyCopy }}>
                <Typography.Text
                    type={highlight ? 'success' : null}
                    style={{ wordWrap: 'break-word' }}
                >
                    {children}
                </Typography.Text>
            </Col>
        </>
    )
}

export { PageFieldRow }