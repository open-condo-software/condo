import classNames from 'classnames'
import React from 'react'

import { Check } from '@open-condo/icons'
import { Space, Typography, Tooltip } from '@open-condo/ui/src'

export type StepItem = {
    title: string,
    breakPoint?: boolean
}

export type StepProps = StepItem & {
    index: number
    size: 'large' | 'small'
    type: 'active' | 'disabled' | 'done'
    onClick?: () => void
    noReturnMessage?: string
}

const STEP_CLASS_PREFIX = 'condo-steps-step'
const DEFAULT_NO_RETURN_MESSAGE = 'At this point it is impossible to go back to this step'

type WithTooltipProps = {
    title: string
    show: boolean
    children: React.ReactNode
}

const WithTooltip: React.FC<WithTooltipProps> = ({ title, show, children }) => (
    show
        ? <Tooltip title={title} placement='bottomLeft'>{children}</Tooltip>
        : <>{children}</>
)

export const Step: React.FC<StepProps> = ({ size, index, title, type, onClick, noReturnMessage }) => {
    const className = classNames({
        [STEP_CLASS_PREFIX]: true,
        [`${STEP_CLASS_PREFIX}-${size}`]: size,
        [`${STEP_CLASS_PREFIX}-${type}`]: type,
    })

    const indexLevel = size === 'large' ? 4 : 5
    const indexType = type === 'disabled' ? 'secondary' : 'inverted'
    const iconSize = size === 'large' ? 'large' : 'medium'
    const titleSize = size === 'large' ? 'large' : 'medium'
    const titleType = type === 'disabled' ? 'secondary' : undefined

    return (
        <WithTooltip title={noReturnMessage || DEFAULT_NO_RETURN_MESSAGE} show={type === 'done'}>
            <div className={className} onClick={onClick}>
                <Space size={12} direction='horizontal' align='center'>
                    <div className={`${STEP_CLASS_PREFIX}-index`}>
                        {type === 'done' ? (
                            <Check size={iconSize}/>
                        ) : (
                            <Typography.Title level={indexLevel} type={indexType}>
                                {index}
                            </Typography.Title>
                        )}

                    </div>
                    <Typography.Text size={titleSize} type={titleType}>
                        {title}
                    </Typography.Text>
                </Space>
            </div>
        </WithTooltip>
    )
}