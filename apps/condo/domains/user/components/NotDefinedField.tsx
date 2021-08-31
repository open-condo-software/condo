import { Typography } from 'antd'
import React, { ReactElement } from 'react'
import { useIntl } from '@core/next/intl'
import { fontSizes } from '@condo/domains/common/constants/style'

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
        : <Typography.Text style={{ fontSize: fontSizes.content }}>{value}</Typography.Text>
}
