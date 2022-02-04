/** @jsx jsx */

import { Affix, Space } from 'antd'
import React, { CSSProperties } from 'react'
import { css, jsx } from '@emotion/core'
import get from 'lodash/get'

const actionBar = css`
    position: relative;
    padding: 24px;
    transition: box-shadow 0.6s ease-out;

    .ant-affix & {
        background: rgba(255,255,255,0.9);
        box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05), 0px 6px 16px rgba(0, 0, 0, 0.08), 0px 3px 6px -4px rgba(0, 0, 0, 0.12);
        border-radius: 8px;
    }
`
interface IActionBarProps {
    fullscreen?: boolean
    hidden?: boolean
    style?: CSSProperties
}

const ActionBar: React.FC<IActionBarProps> = (props) => {
    const { children, fullscreen = true, hidden } = props
    const style = get(props, 'style', {})
    const barWidthStyle = { width: fullscreen ? '100%' : 'unset', ...style }

    if (hidden) {
        return null
    }

    return (
        <Affix offsetBottom={48} style={barWidthStyle}>
            <Space wrap={true} size={[40, 24]} css={actionBar} style={barWidthStyle}>
                { children }
            </Space>
        </Affix>
    )
}

export default ActionBar
