import { Input as InputComponent } from './input'
import { Password } from './password'
import { Phone } from './phone'
import { RichTextAreaWithPanel } from './richTextArea'
import { TextArea } from './textArea'
import './style.less'

export type { BaseInputProps, InputProps } from './input'
export type { PasswordInputProps } from './password'
export type { PhoneInputProps } from './phone'
export type { TextAreaProps } from './textArea'
export type { RichTextAreaWithPanelProps, RichTextAreaRef, RichTextButtonProps } from './richTextArea'
export { RichTextCheckboxButton, RichTextListButton } from './richTextArea'

export type InputType = typeof InputComponent & {
    Password: typeof Password
    Phone: typeof Phone
    TextArea: typeof TextArea
    RichTextArea: typeof RichTextAreaWithPanel
}

const Input = InputComponent as InputType
Input.Password = Password
Input.Phone = Phone
Input.TextArea = TextArea
Input.RichTextArea = RichTextAreaWithPanel

export {
    Input,
}