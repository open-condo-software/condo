import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { Loader } from '@miniapp/domains/common/components/Loader'


type LoadingOrErrorProps = {
    showLoading?: boolean
    showError?: boolean
    errorMessage?: string
}

export const LoadingOrError: React.FC<LoadingOrErrorProps> = (props) => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'common.errors.serverError' })

    const { showLoading, showError, errorMessage } = props

    if (showLoading) {
        return <Loader fill size='large'/>
    }

    if (showError) {
        return <Typography.Title>{errorMessage || ServerErrorMessage}</Typography.Title>
    }

    return null
}
