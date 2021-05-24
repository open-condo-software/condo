import { Typography } from 'antd'
import React, { ReactElement } from 'react'
import { useIntl } from '@core/next/intl'

interface INotDefinedFieldProps {
    showMessage?: boolean
    value?: string
    render?: (value: string) => ReactElement
}

export const NotDefinedField: React.FC<INotDefinedFieldProps> = (props) => {
    const {
        value,
        render,
        showMessage = true,
    } = props

    const intl = useIntl()
    const NotDefinedMessage = intl.formatMessage({ id: 'errors.NotDefined' })

    if (!value) {
        return showMessage ? NotDefinedMessage : null
    }

    return render
        ? render(value)
        : <Typography.Text style={{ fontSize: '16px' }}>{value}</Typography.Text>
}
