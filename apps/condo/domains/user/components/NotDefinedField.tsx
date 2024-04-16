import React, { ReactElement } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'


type DisplayValue = string | any[] | React.ReactNode

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
        : <Typography.Text>{value}</Typography.Text>
}
