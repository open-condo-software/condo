import type { CheckboxChangeEvent } from 'antd/lib/checkbox'
import React from 'react'

import { Checkbox, Tooltip } from '@open-condo/ui/src'


type SelectionCheckboxProps = {
    checked: boolean
    indeterminate?: boolean
    disabled?: boolean
    tooltip?: React.ReactNode
    onChange: (event: CheckboxChangeEvent) => void
}

export function SelectionCheckbox ({ checked, disabled, indeterminate, tooltip, onChange }: SelectionCheckboxProps) {
    const checkbox = (
        <span
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            <Checkbox
                checked={checked}
                indeterminate={indeterminate}
                disabled={disabled}
                onChange={onChange}
            />
        </span>
    )

    if (!tooltip) return checkbox

    return (
        <Tooltip title={tooltip} placement='topLeft'>
            {checkbox}
        </Tooltip>
    )
}
