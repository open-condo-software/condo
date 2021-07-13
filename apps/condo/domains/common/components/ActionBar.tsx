/** @jsx jsx */

import { Affix, Space } from 'antd'
import React from 'react'
import { css, jsx } from '@emotion/core'


const actionBar = css`
    padding: 24px;
    margin: 0 -24px;
    transition: box-shadow 0.6s ease-out;

    .ant-affix & {
        background: rgba(255,255,255,0.9);
        box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05), 0px 6px 16px rgba(0, 0, 0, 0.08), 0px 3px 6px -4px rgba(0, 0, 0, 0.12);
        border-radius: 8px;
    }  
`
interface IActionBarProps {
    fullscreen?: boolean;
}
const ActionBar: React.FC<IActionBarProps> = ({ children, fullscreen = false }) => {
    return (
        <Affix offsetBottom={24} style={{ width: fullscreen ? '100%' : 'unset' }}>
            <div css={actionBar}>
                <Space size={40}>
                    { children }
                </Space>
            </div>
        </Affix>
    )
}

export default ActionBar
