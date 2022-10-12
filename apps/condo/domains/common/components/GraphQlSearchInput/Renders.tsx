import React  from 'react'
import { Select, Typography } from 'antd'

const HIDDEN_OPTION_STYLE: React.CSSProperties = { display: 'none' }

export const renderBlockedOption = (option, prefix?, index?) => {
    const value = ['string', 'number'].includes(typeof option.value) ? option.value : JSON.stringify(option)
    const text = prefix ? `(${prefix}) ${option.text}` : option.text
    return (
        <Select.Option id={index} key={option.key || value} value={value} title={text} disabled style={HIDDEN_OPTION_STYLE}>
            <Typography.Text title={text}>
                {text}
            </Typography.Text>
        </Select.Option>
    )
}
