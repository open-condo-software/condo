import { Radio as DefaultRadio } from 'antd'
import React from 'react'

import { Typography } from '../Typography'

import type { TypographyTextProps } from '../Typography'
import type { RadioProps as DefaultRadioProps } from 'antd'

const RADIO_CLASS_PREFIX = 'condo-radio'

type CondoRadioProps = {
    label?: string
    labelProps?: TypographyTextProps
}

export type RadioProps = Pick<DefaultRadioProps, 'autoFocus' | 'defaultChecked' | 'disabled' | 'onChange' | 'checked' | 'value'>
& CondoRadioProps

const Radio: React.FC<RadioProps> = (props) => {
    const { label, labelProps, disabled, ...rest } = props
    return (
        <DefaultRadio
            {...rest}
            prefixCls={RADIO_CLASS_PREFIX}
            disabled={disabled}
        >
            {label && (<Typography.Text
                size='medium'
                disabled={disabled}
                {...labelProps}
            >
                {label}
            </Typography.Text>)}
        </DefaultRadio>
    )
}

export {
    Radio,
}
