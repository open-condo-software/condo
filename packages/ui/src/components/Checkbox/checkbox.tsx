import { Checkbox as DefaultCheckbox, CheckboxProps as DefaultCheckboxProps } from 'antd'
import React, { useCallback } from 'react'

import { extractChildrenContent, sendAnalyticsCheckEvent } from '../_utils/analytics'
import { Typography, TypographyTextProps } from '../Typography'

import type { CheckboxChangeEvent } from 'antd/lib/checkbox'

const CHECKBOX_CLASS_PREFIX = 'condo-checkbox'

type CondoCheckboxProps = {
    label?: string
    labelProps?: TypographyTextProps
}

export type CheckboxProps = Pick<DefaultCheckboxProps,
'autoFocus'
| 'defaultChecked'
| 'disabled'
| 'onChange'
| 'indeterminate'
| 'checked'
| 'children'
| 'id'
| 'className'
| 'onMouseLeave'
| 'onMouseEnter'
| 'tabIndex'
| 'value'> & CondoCheckboxProps

const Checkbox: React.FC<CheckboxProps> = (props) => {
    const {
        label,
        labelProps,
        disabled,
        id,
        onChange,
        children,
        ...rest
    } = props

    const handleChange = useCallback((event: CheckboxChangeEvent) => {
        const stringContent = label ? label : extractChildrenContent(children)
        if (stringContent) {
            sendAnalyticsCheckEvent('Checkbox', { value: stringContent, id })
        }

        if (onChange) {
            onChange(event)
        }
    }, [label, children, onChange, id])

    return (
        <DefaultCheckbox
            {...rest}
            id={id}
            prefixCls={CHECKBOX_CLASS_PREFIX}
            disabled={disabled}
            onChange={handleChange}
        >
            {
                label
                    ? <Typography.Text size='medium' disabled={disabled} {...labelProps}>{label}</Typography.Text>
                    : children
            }
        </DefaultCheckbox>
    )
}

export {
    Checkbox,
}
