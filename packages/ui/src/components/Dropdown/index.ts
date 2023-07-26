import './style.less'

import { Dropdown as InternalDropdown } from './dropdown'
import { DropdownButton } from './dropdownButton'

export type { DropdownProps, ItemType } from './dropdown'
export type { DropdownButtonProps } from './dropdownButton'


type CombinedDropdownType = typeof InternalDropdown & {
    Button: typeof DropdownButton
}

const Dropdown = InternalDropdown as CombinedDropdownType

Dropdown.Button = DropdownButton

export { Dropdown }
