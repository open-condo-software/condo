import { Typography } from 'antd'
import React, { ReactElement, useMemo } from 'react'
import { useIntl } from '@core/next/intl'

interface INotDefinedFieldProps {
    value?: string
    render?: (value: string) => ReactElement
}

export const NotDefinedField: React.FC<INotDefinedFieldProps> = ({ value, render }) => {
    const intl = useIntl()

    const child = render
        ? render(value)
        : <Typography.Text style={{ fontSize: '16px' }}>{value}</Typography.Text>

    return (
        value
            ? child
            : intl.formatMessage({ id: 'errors.NotDefined' })
    )
}
