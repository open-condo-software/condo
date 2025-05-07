import './style.less'
import './icon/style.less'
import './text/style.less'

import { Button as InternalButton } from './button'
import { IconButton } from './icon/iconButton'
import { TextButton } from './text/textButton'

export type { ButtonProps } from './button'
export type { IconButtonProps } from './icon/iconButton'

type CombinedButtonType = typeof InternalButton & {
    Icon: typeof IconButton
    Text: typeof TextButton
}

const Button = InternalButton as CombinedButtonType
Button.Icon = IconButton
Button.Text = TextButton

export { Button }
