import { Checkbox as DefaultCheckbox } from 'antd'
import React from 'react'

import type { ComponentProps } from 'react'

const DefaultCheckboxGroup = DefaultCheckbox.Group
type DefaultCheckboxGroupProps = ComponentProps<typeof DefaultCheckboxGroup>

export type CheckboxGroupProps = Pick<DefaultCheckboxGroupProps,
'children'
| 'className'
| 'name'
| 'disabled'
| 'onChange'
| 'defaultValue'
| 'value'>

const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>((props, ref) => {
    return <DefaultCheckboxGroup ref={ref} {...props}>{props.children}</DefaultCheckboxGroup>
})

CheckboxGroup.displayName = 'CheckboxGroup'

export {
    CheckboxGroup,
}