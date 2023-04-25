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

// TODO(DOMA-5430): breaking changes (v2.0.0)
export type RadioGroupProps = {
    /**
     * @deprecated should use "children" and "RadioGroup.ItemGroup" instead of "groups". "groups" will be removed in the next major release (v2).
     */
    groups?: Array<ItemGroupProps>
} & Pick<DefaultRadioGroupProps, 'value' | 'onChange' | 'disabled' | 'children'>

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

const CondoRadioGroup: React.FC<RadioGroupProps> = (props) => {
    const { groups, children, ...rest } = props

    return (
        <DefaultRadio.Group
            {...rest}
            prefixCls={RADIO_GROUP_CLASS_PREFIX}
        >
            {groups ? groups.map(group => (
                <ItemGroup name={group.name} options={group.options} key={group.name} />
            )) : children}
        </DefaultRadio.Group>
    )
}

const RadioGroup = CondoRadioGroup as CompoundedComponent
RadioGroup.ItemGroup = ItemGroup

export {
    RadioGroup,
}
