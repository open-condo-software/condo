import React from 'react'
import { Alert as DefaultAlert, AlertProps as DefaultAlertProps } from 'antd'

type CondoAlertProps = {
    type: 'success' | 'info' | 'warning' | 'error';
}

const ALERT_CLASS_PREFIX = 'condo-alert'

export type AlertProps = Pick<DefaultAlertProps, 'message' | 'showIcon' | 'description' | 'action'> & CondoAlertProps

const Alert: React.FC<AlertProps> = (props) => {
    const { type, ...rest } = props

    return (
        <DefaultAlert
            {...rest}
            type = {type}
            prefixCls={ALERT_CLASS_PREFIX}
        />
    )
}

export {
    Alert,
}
