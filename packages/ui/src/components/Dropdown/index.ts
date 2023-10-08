import './style.less'

import { DropdownButton } from './button'
import { Dropdown as InternalDropdown } from './dropdown'

export type { DropdownProps } from './dropdown'
export type { DropdownButtonProps, ItemType } from './button'


type CombinedDropdownType = typeof InternalDropdown & {
    Button: typeof DropdownButton
}

const Dropdown = InternalDropdown as CombinedDropdownType

Dropdown.Button = DropdownButton

export { Dropdown }
