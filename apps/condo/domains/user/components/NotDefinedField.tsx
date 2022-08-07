import { Typography } from 'antd'
import React, { ReactElement } from 'react'
import { useIntl } from '@condo/next/intl'
import { fontSizes } from '@condo/domains/common/constants/style'

type DisplayValue = string | any[]

interface INotDefinedFieldProps {
    showMessage?: boolean
    value?: DisplayValue
    render?: (value: DisplayValue) => ReactElement
}

export const NotDefinedField: React.FC<INotDefinedFieldProps> = (props) => {
    const {
        value,
        render,
        showMessage = true,
    } = props

    const intl = useIntl()
    const NotDefinedMessage = intl.formatMessage({ id: 'errors.NotDefined' })

    if (!value || Array.isArray(value) && value.length === 0) {
        return showMessage ? NotDefinedMessage : null
    }

    return render
        ? render(value)
        : <Typography.Text style={{ fontSize: fontSizes.content }}>{value}</Typography.Text>
}
