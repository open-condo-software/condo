import { Input as InputComponent } from './input'
import { Password } from './password'
import './style.less'

export type { BaseInputProps, InputProps } from './input'
export type { PasswordInputProps } from './password'

export type InputType = typeof InputComponent & {
    Password: typeof Password,
}

const Input = InputComponent as InputType
Input.Password = Password

export {
    Input,
}