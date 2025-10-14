import { Radio as DefaultRadio } from 'antd'
import classNames from 'classnames'
import React, { useState, useCallback } from 'react'

import { ChevronDown } from '@open-condo/icons'
import { Radio, Typography, Space } from '@open-condo/ui/src'
import type { RadioProps } from '@open-condo/ui/src'

import type { RadioGroupProps as DefaultRadioGroupProps } from 'antd'

const RADIO_GROUP_CLASS_PREFIX = 'condo-radio'

type ItemGroupOptionType = Pick<RadioProps, 'value' | 'label'> & {
    radioProps?: Partial<Pick<RadioProps, 'labelProps' | 'disabled'>>
}

export type ItemGroupProps = {
    name: string
    options: Array<ItemGroupOptionType>
}

export type RadioGroupProps = Pick<DefaultRadioGroupProps, 'id' | 'className' | 'value' | 'onChange' | 'disabled' | 'children' | 'optionType' | 'defaultValue'>

type CompoundedComponent = React.FC<RadioGroupProps> & {
    ItemGroup: React.FC<ItemGroupProps>
}

const ItemGroup: React.FC<ItemGroupProps> = ({ name, options }) => {
    const [open, setOpen] = useState(false)

    const onGroupClick = useCallback(() => {
        setOpen(!open)
    }, [open])

    const rootClassName = classNames(`${RADIO_GROUP_CLASS_PREFIX}-group-container`, {
        open,
    })

    return (
        <div key={name} className={rootClassName}>
            <div
                className={`${RADIO_GROUP_CLASS_PREFIX}-group-title`}
                onClick={onGroupClick}
            >
                <span className={`${RADIO_GROUP_CLASS_PREFIX}-group-icon`}><ChevronDown size='small' /></span>
                <Typography.Text>{name}</Typography.Text>
            </div>
            <Space
                direction='vertical'
                size={12}
            >
                {options.map(({ value, label, radioProps }) => (
                    <Radio key={value} label={label} value={value} {...radioProps} />
                ))}
            </Space>
        </div>
    )
}

const CondoRadioGroup: React.FC<RadioGroupProps> = ({  optionType, ...props }) => {
    const groupClassName = classNames({
        [`${RADIO_GROUP_CLASS_PREFIX}-button`]: optionType === 'button',
    })

    return (
        <DefaultRadio.Group
            {...props}
            className={groupClassName}
            prefixCls={RADIO_GROUP_CLASS_PREFIX}
            optionType={optionType}
        />
    )
}

const RadioGroup = CondoRadioGroup as CompoundedComponent
RadioGroup.ItemGroup = ItemGroup

export {
    RadioGroup,
}
