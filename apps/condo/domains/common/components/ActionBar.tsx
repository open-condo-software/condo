/** @jsx jsx */

import { Affix, Space } from 'antd'
import React, { CSSProperties } from 'react'
import { css, jsx } from '@emotion/react'

const actionBar = css`
    position: relative;
    padding: 24px;
    box-sizing: border-box;
    left: -24px;
    transition: box-shadow 0.6s ease-out;

    .ant-affix & {
        background: rgba(255,255,255,0.9);
        box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05), 0px 6px 16px rgba(0, 0, 0, 0.08), 0px 3px 6px -4px rgba(0, 0, 0, 0.12);
        border-radius: 8px;
    }
`
interface IActionBarProps {
    hidden?: boolean
    style?: CSSProperties
    isFormActionBar?: boolean
}

const ActionBar: React.FC<IActionBarProps> = (props) => {
    const { children, hidden } = props
    const barWidthStyle = { width: props.isFormActionBar ? '100%' : 'calc(100% + 48px)' }

    if (hidden) {
        return null
    }

    return (
        <Affix offsetBottom={48} style={barWidthStyle}>
            <Space wrap={true} size={[24, 24]} css={actionBar} style={barWidthStyle}>
                { children }
            </Space>
        </Affix>
    )
}

export default ActionBar
