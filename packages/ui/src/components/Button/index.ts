import './style.less'
import './icon/style.less'

import { Button as InternalButton } from './button'
import { IconButton } from './icon/iconButton'

export type { ButtonProps } from './button'
export type { IconButtonProps } from './icon/iconButton'

type CombinedButtonType = typeof InternalButton & {
    /**
     * @deprecated
     */
    Icon: typeof IconButton
}

const Button = InternalButton as CombinedButtonType
Button.Icon = IconButton

export { Button }
