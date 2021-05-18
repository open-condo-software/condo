import { Typography } from 'antd'
import React, { ReactElement } from 'react'
import { useIntl } from '@core/next/intl'

interface INotDefinedFieldProps {
    value?: string
    render?: (value: string) => ReactElement
}

export const NotDefinedField: React.FC<INotDefinedFieldProps> = ({ value, render }) => {
    const intl = useIntl()
    const NotDefinedMessage = intl.formatMessage({ id: 'errors.NotDefined' })

    if (!value) {
        return NotDefinedMessage
    }

    return render
        ? render(value)
        : <Typography.Text style={{ fontSize: '16px' }}>{value}</Typography.Text>
}
