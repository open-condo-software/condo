import {
    Input as DefaultInput,
} from 'antd'
import React from 'react'

import { INPUT_CLASS_PREFIX } from './input'

import type { BaseInputProps } from './input'
import type { PasswordProps } from 'antd/lib/input'
import type { InputRef } from 'antd/lib/input'

export type PasswordInputProps = BaseInputProps & Pick<PasswordProps, 'visibilityToggle'>

const Password: React.ForwardRefExoticComponent<PasswordInputProps & React.RefAttributes<InputRef>> = React.forwardRef((props, ref) => {
    return <DefaultInput.Password {...props} ref={ref} inputPrefixCls={INPUT_CLASS_PREFIX}/>
})

Password.displayName = 'PasswordInput'

export {
    Password,
}