import { Input as InputComponent } from './input'
import { Password } from './password'
import { Phone } from './phone'
import { RichTextArea } from './richTextArea'
import { TextArea } from './textArea'
import './style.less'

export type { BaseInputProps, InputProps } from './input'
export type { PasswordInputProps } from './password'
export type {
    RichTextAreaProps,
    RichTextAreaCustomLabels,
    BuiltinToolbarButton,
    ToolbarGroup,
} from './richTextArea'
export type { PhoneInputProps } from './phone'

export type InputType = typeof InputComponent & {
    Password: typeof Password
    Phone: typeof Phone
    TextArea: typeof TextArea
    RichTextArea: typeof RichTextArea
}

const Input = InputComponent as InputType
Input.Password = Password
Input.Phone = Phone
Input.TextArea = TextArea
Input.RichTextArea = RichTextArea

export {
    Input,
}