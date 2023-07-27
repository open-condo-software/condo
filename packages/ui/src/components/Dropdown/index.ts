import './style.less'

import { Dropdown as InternalDropdown } from './dropdown'
import { DropdownButton } from './dropdownButton'

export type { DropdownProps } from './dropdown'
export type { DropdownButtonProps, ItemType } from './dropdownButton'


type CombinedDropdownType = typeof InternalDropdown & {
    Button: typeof DropdownButton
}

const Dropdown = InternalDropdown as CombinedDropdownType

Dropdown.Button = DropdownButton

export { Dropdown }
