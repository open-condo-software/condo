import { Checkbox as DefaultCheckbox } from 'antd'
import React from 'react'

import type { ComponentProps } from 'react'

const DefaultChechboxGroup = DefaultCheckbox.Group
type DefaultCheckboxGroupProps = ComponentProps<typeof DefaultChechboxGroup>

export type CheckboxGroupProps = Pick<DefaultCheckboxGroupProps,
'children'
| 'className'
| 'key'
| 'name'
| 'disabled'
| 'onChange'
| 'defaultValue'
| 'value'>

const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>((props, ref) => {
    return <DefaultChechboxGroup ref={ref} {...props}>{props.children}</DefaultChechboxGroup>
})

CheckboxGroup.displayName = 'CheckboxGroup'

export {
    CheckboxGroup,
}