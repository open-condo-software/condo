import { Typography } from 'antd'
import React, { ReactElement } from 'react'
import { useIntl } from '@core/next/intl'

interface INotDefinedFieldProps {
    value?: string
    render?: (value: string) => ReactElement
}

export const NotDefinedField: React.FC<INotDefinedFieldProps> = ({ value, render }) => {
    const intl = useIntl()

    if (!value) {
        return intl.formatMessage({ id: 'errors.NotDefined' })
    }

    return render
        ? render(value)
        : <Typography.Text style={{ fontSize: '16px' }}>{value}</Typography.Text>
}
