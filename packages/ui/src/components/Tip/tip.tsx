import { Tooltip as DefaultTooltip } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Close } from '@open-condo/icons'

import { Space } from '../Space'
import { Typography } from '../Typography'

import type { TooltipProps as DefaultTooltipProps } from 'antd'

const TIP_CLASS_PREFIX = 'condo-tooltip'

export type TipProps = Pick<DefaultTooltipProps,
'open'
| 'className'
| 'id'
| 'placement'
| 'destroyTooltipOnHide'
| 'zIndex'> & {
    title: string
    message: string
    onClose?: () => void
    children?: React.ReactNode
}

export const Tip: React.FC<TipProps> = (props) => {
    const { title, message, open: initialOpen, onClose, ...otherProps } = props
    const [open, setOpen] = useState<boolean | undefined>(initialOpen)

    useEffect(() => {
        setOpen(initialOpen)
    }, [initialOpen])

    const handleClose = useCallback(() => {
        if (onClose) {
            onClose()
        }

        setOpen(false)
    }, [onClose])

    const tooltipContent = useMemo(() => (
        <>
            <div className='condo-tip-icon-wrapper'>
                <Close size='small' onClick={handleClose} />
            </div>
            <Space size={4} direction='vertical'>
                <div className='condo-tip-title'>
                    <Typography.Title level={4}>
                        {title}
                    </Typography.Title>
                </div>
                <div className='condo-tip-message'>
                    <Typography.Text size='small'>
                        {message}
                    </Typography.Text>
                </div>
            </Space>
        </>
    ), [handleClose, message, title])
    
    return (
        <DefaultTooltip
            {...otherProps}
            title={tooltipContent}
            open={open}
            showArrow
            arrowPointAtCenter
            prefixCls={TIP_CLASS_PREFIX}
            overlayClassName='condo-tip'
            trigger={[]}
        />
    )
}