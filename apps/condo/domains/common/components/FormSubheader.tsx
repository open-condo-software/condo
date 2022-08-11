import { Typography } from 'antd'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import React from 'react'
import { QuestionCircleFilled } from '@ant-design/icons'
import { grey } from '@ant-design/colors'
import { fontSizes } from '@condo/domains/common/constants/style'

interface IFormSubheaderProps {
    title: string,
    hint?: string
}

/**
 * Displays a subtitle and an optional hint in a tooltip
 */
const FormSubheader: React.FC<IFormSubheaderProps> = ({ title, hint }) => {
    return (
        <Typography.Title level={2} style={{ fontSize: fontSizes.content }}>
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