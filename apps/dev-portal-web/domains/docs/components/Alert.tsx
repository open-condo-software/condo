import React from 'react'

import { Alert as UIAlert } from '@open-condo/ui'
import type { AlertProps as UIAlertProps } from '@open-condo/ui'

type AlertProps = UIAlertProps & {
    children: React.ReactNode
}

export const Alert = ({ showIcon = true, description, children, ...restProps }: AlertProps): React.ReactElement => {
    return <UIAlert {...restProps} showIcon={showIcon} description={description || children}/>
}