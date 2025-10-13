import { Checkbox as ChechboxComponent } from './checkbox'
import { CheckboxGroup } from './checkboxGroup'
import './style.less'

type CheckboxType = typeof ChechboxComponent & {
    Group: typeof CheckboxGroup
}

const Checkbox = ChechboxComponent as CheckboxType
Checkbox.Group = CheckboxGroup

export type { CheckboxProps } from './checkbox'
export { Checkbox }