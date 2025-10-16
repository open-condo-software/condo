import { Radio as DefaultRadio } from 'antd'
import React, { useCallback } from 'react'

import { sendAnalyticsCheckEvent, extractChildrenContent } from '../_utils/analytics'
import { Typography } from '../Typography'

import type { TypographyTextProps } from '../Typography'
import type { RadioProps as DefaultRadioProps, RadioChangeEvent } from 'antd'

const RADIO_CLASS_PREFIX = 'condo-radio'

type CondoRadioProps = {
    label?: React.ReactNode
    labelProps?: TypographyTextProps
    icon?: React.ReactNode
}

export type RadioProps = Pick<DefaultRadioProps, 'autoFocus' | 'defaultChecked' | 'disabled' | 'onChange' | 'checked' | 'value' | 'children' | 'id'>
& CondoRadioProps

const Radio: React.FC<RadioProps> = (props) => {
    const { label, icon, labelProps, disabled, onChange, children, id, ...rest } = props

    const handleChange = useCallback((event: RadioChangeEvent) => {
        const stringContent = extractChildrenContent(label)

        if (stringContent) {
            sendAnalyticsCheckEvent('Radio', { value: stringContent, id })
        }

        if (onChange) {
            onChange(event)
        }
    }, [label, onChange, id])
    const wrappedIcon = icon
        ? <span className={`${RADIO_CLASS_PREFIX}-icon`}>{icon}</span>
        : null

    return (
        <DefaultRadio
            {...rest}
            id={id}
            prefixCls={RADIO_CLASS_PREFIX}
            disabled={disabled}
            onChange={handleChange}
        >
            {
                (label || wrappedIcon)
                    ? (
                        <div className={`${RADIO_CLASS_PREFIX}-label-container`}>
                            {wrappedIcon}
                            {
                                label && (
                                    <Typography.Text size='medium' disabled={disabled}  {...labelProps}>
                                        {label}
                                    </Typography.Text>
                                )
                            }
                        </div>
                    )
                    : children
            }
        </DefaultRadio>
    )
}

export {
    Radio,
}
