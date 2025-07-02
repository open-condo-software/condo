import React from 'react'

import { Alert as UIAlert } from '@open-condo/ui'
import type { AlertProps as UIAlertProps } from '@open-condo/ui'

type AlertProps = UIAlertProps & {
    children: React.ReactNode
}

export const Alert: React.FC<AlertProps> = ({ showIcon = true, description, children, ...restProps }) => {
    return <UIAlert {...restProps} showIcon={showIcon} description={description || children}/>
}