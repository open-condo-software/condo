import { Col, Row, Tooltip, Typography } from 'antd'
import React from 'react'
import { QuestionCircleFilled } from '@ant-design/icons'
import { grey } from '@ant-design/colors'
import { fontSizes } from '@condo/domains/common/constants/style'

const { bodyCopy } = fontSizes

interface IFormSubheaderProps {
    title: string,
    hint?: string
}

/**
 * Displays a subtitle and an optional hint in a tooltip
 */
const FormSubheader: React.FC<IFormSubheaderProps> = ({ title, hint }) => {
    return (
        <Typography.Title level={2} style={{ fontSize: bodyCopy }}>
            {title}
            {hint && (
                <>
                    &nbsp;
                    <Tooltip title={hint}>
                        <QuestionCircleFilled style={{ color: grey[0] }}/>
                    </Tooltip>
                </>
            )}
        </Typography.Title>
    )
}

export default FormSubheader