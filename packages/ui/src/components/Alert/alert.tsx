import React from 'react'
import { Alert as DefaultAlert, AlertProps as DefaultAlertProps } from 'antd'
import classNames from 'classnames'

type CondoAlertProps = {
    type: 'success' | 'info' | 'warning' | 'error';
}

const ALERT_CLASS_PREFIX = 'condo-alert'

export type AlertProps = Omit<DefaultAlertProps, 'type' | 'prefix' | 'prefixCls' | 'banner' | 'afterClose' | 'closable' | 'closeText' | 'closeIcon' | 'onClose'> & CondoAlertProps

const Alert: React.FC<AlertProps> = (props) => {
    const { type, className, ...rest } = props

    const classes = classNames(
        {
            [`${ALERT_CLASS_PREFIX}-${type}`]: type,
        },
        className,
    )

    return (
        <DefaultAlert
            {...rest}
            type = {type}
            prefixCls={ALERT_CLASS_PREFIX}
            className={classes}
        />
    )
}

export {
    Alert,
}
