import { Alert as DefaultAlert, AlertProps as DefaultAlertProps } from 'antd'
import React from 'react'

type CondoAlertProps = {
    type: 'success' | 'info' | 'warning' | 'error';
}

const ALERT_CLASS_PREFIX = 'condo-alert'

export type AlertProps = Pick<DefaultAlertProps, 'message' | 'showIcon' | 'description'> & CondoAlertProps

const Alert: React.FC<AlertProps> = (props) => {
    return (
        <DefaultAlert
            {...props}
            prefixCls={ALERT_CLASS_PREFIX}
        />
    )
}

export {
    Alert,
}
