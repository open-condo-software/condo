import { Radio as DefaultRadio, Space } from 'antd'
import classNames from 'classnames'
import React, { useState } from 'react'

import { ChevronDown } from '@open-condo/icons'
import { Radio, Typography } from '@open-condo/ui/src'
import type { RadioProps } from '@open-condo/ui/src'

import type { RadioGroupProps as DefaultRadioGroupProps } from 'antd'

const RADIO_GROUP_CLASS_PREFIX = 'condo-radio'

type RadioGroupOptionType = Pick<RadioProps, 'value' | 'label'> & {
    radioProps?: Partial<Pick<RadioProps, 'labelProps' | 'disabled'>>
}

type RadioGroupType = {
    name: string
    options: Array<RadioGroupOptionType>
}

export type RadioGroupProps = {
    groups: Array<RadioGroupType>
} & Pick<DefaultRadioGroupProps, 'value' | 'onChange' | 'disabled'>

const GroupWithIcon: React.FC<RadioGroupType> = ({ name, options }) => {
    const [open, setOpen] = useState(false)

    const onGroupClick = () => {
        setOpen(!open)
    }

    const rootClassName = classNames(RADIO_GROUP_CLASS_PREFIX + '-group-container', {
        open,
    })

    return (
        <div key={name} className={rootClassName}>
            <div
                className={RADIO_GROUP_CLASS_PREFIX + '-group-title'}
                onClick={onGroupClick}
            >
                <ChevronDown size='small' />
                <Typography.Text>{name}</Typography.Text>
            </div>
            <Space
                direction='vertical'
                size={14}
                prefixCls='condo-space'
            >
                {options.map(({ value, label, radioProps }) => (
                    <Radio key={value} label={label} value={value} {...radioProps} />
                ))}
            </Space>
        </div>
    )
}

const RadioGroup: React.FC<RadioGroupProps> = (props) => {
    const { groups, ...rest } = props

    return (
        <DefaultRadio.Group
            {...rest}
            prefixCls={RADIO_GROUP_CLASS_PREFIX}
        >
            {groups.map(group => (
                <GroupWithIcon name={group.name} options={group.options} key={group.name} />
            ))}
        </DefaultRadio.Group>
    )
}

export {
    RadioGroup,
}
