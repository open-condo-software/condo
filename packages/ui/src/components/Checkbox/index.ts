import { Checkbox as CheckboxComponent } from './checkbox'
import { CheckboxGroup } from './checkboxGroup'
import './style.less'

type CheckboxType = typeof CheckboxComponent & {
    Group: typeof CheckboxGroup
}

const Checkbox = CheckboxComponent as CheckboxType
Checkbox.Group = CheckboxGroup

export type { CheckboxProps } from './checkbox'
export { Checkbox }