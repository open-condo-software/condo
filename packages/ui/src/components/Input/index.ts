import { Input as InputComponent } from './input'
import { Password } from './password'
import { Phone } from './phone'
import './style.less'

export type { BaseInputProps, InputProps } from './input'
export type { PasswordInputProps } from './password'
export type { PhoneInputProps } from './phone'

export type InputType = typeof InputComponent & {
    Password: typeof Password
    Phone: typeof Phone
}

const Input = InputComponent as InputType
Input.Password = Password
Input.Phone = Phone

export {
    Input,
}