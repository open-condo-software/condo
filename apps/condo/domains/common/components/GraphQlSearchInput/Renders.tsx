import React  from 'react'
import { Select, Typography } from 'antd'

export const renderBlockedObject = (intl, text, postfix?) => {
    const BlockedMessage = intl.formatMessage({ id: 'employee.isBlocked' })
    const Postfix = postfix || ` (${BlockedMessage})`
    const textTitle = text + Postfix

    return (
        <Typography.Text title={textTitle}>
            <Typography.Text delete>
                {text}
            </Typography.Text>
            {Postfix}
        </Typography.Text>
    )
}

const HIDDEN_OPTION_STYLE: React.CSSProperties = { display: 'none' }

export const renderBlockedOption = (intl, option, postfix?) => {
    const value = ['string', 'number'].includes(typeof option.value) ? option.value : JSON.stringify(option)
    const text = option.text
    const BlockedMessage = intl.formatMessage({ id: 'employee.isBlocked' })
    const Postfix = postfix || ` (${BlockedMessage})`
    const textTitle = text + Postfix

    return (
        <Select.Option key={option.key || value} value={value} title={textTitle} style={HIDDEN_OPTION_STYLE}>
            {renderBlockedObject(intl, text, postfix)}
        </Select.Option>
    )
}
