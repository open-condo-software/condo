import { Alert as DefaultAlert, AlertProps as DefaultAlertProps } from 'antd'
import classNames from 'classnames'
import React, { useState } from 'react'

import { ChevronDown, ChevronUp } from '@open-condo/icons'

import { Typography } from '../Typography'

type CondoAlertProps = {
    type: 'success' | 'info' | 'warning' | 'error'
    expandable?: boolean
    maxLines?: number
    showMoreText?: string
    showLessText?: string
}

const ALERT_CLASS_PREFIX = 'condo-alert'

export type AlertProps = Pick<DefaultAlertProps, 'message' | 'showIcon' | 'description' | 'banner' | 'action'> & CondoAlertProps

const ALERT_DESCRIPTION_MAX_HEIGHT = '300px'
const ALERT_DEFAULT_SHOW_MORE_TEXT = 'Show more'
const ALERT_DEFAULT_SHOW_LESS_TEXT = 'Show less'

const Alert: React.FC<AlertProps> = ({
    description,
    maxLines,
    showMoreText,
    showLessText,
    ...rest
}) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const toggleDescription = () => setIsExpanded(!isExpanded)

    const renderDescription = () => {
        if (!description) return null

        return (
            <>
                <div style={{
                    maxHeight: maxLines && !isExpanded ? 'none' : ALERT_DESCRIPTION_MAX_HEIGHT,
                    overflowY: 'auto',
                }}>
                    <Typography.Paragraph ellipsis={maxLines && !isExpanded ? { rows: maxLines } : false} >
                        {description}
                    </Typography.Paragraph>
                </div>
                {renderToggle()}
            </>
        )
    }

    const renderToggle = () => {
        if (!maxLines || !description) return null

        const toggleText = isExpanded ? showLessText || ALERT_DEFAULT_SHOW_LESS_TEXT : showMoreText || ALERT_DEFAULT_SHOW_MORE_TEXT

        const icon = isExpanded ? 
            <ChevronUp className={`${ALERT_CLASS_PREFIX}-toggle-icon`} size='small' /> : 
            <ChevronDown className={`${ALERT_CLASS_PREFIX}-toggle-icon`} size='small' />

        return (
            <div className={`${ALERT_CLASS_PREFIX}-toggle-container`}>
                <Typography.Link onClick={toggleDescription} >
                    {toggleText}
                </Typography.Link>
                {icon}
            </div>
        )
    }
    
    return (
        <DefaultAlert
            {...rest}
            prefixCls={ALERT_CLASS_PREFIX}
            description={renderDescription()}
            className={classNames({
                [`${ALERT_CLASS_PREFIX}-expandable`]: !!maxLines,
            })}
        />
    )
}

export {
    Alert,
}
