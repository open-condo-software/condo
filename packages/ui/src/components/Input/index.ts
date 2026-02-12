import { Input as InputComponent } from './input'
import { Password } from './password'
import { Phone } from './phone'
import { TextArea } from './textArea'
import './style.less'
import './markdownEditor.less'
import './richTextArea.less'

export type { BaseInputProps, InputProps } from './input'
export type { MarkdownEditorProps, ToolbarLabels } from './markdownEditor'
export type { PasswordInputProps } from './password'
export type { RichTextAreaProps, RichTextAreaToolbarLabels } from './reachTextAria'
export type { RichTextAreaV2Props, RichTextAreaLinkModalLabels } from './richTextAria'
export type { PhoneInputProps } from './phone'

export { MarkdownEditor, replaceHeaders } from './markdownEditor'
export { RichTextArea } from './reachTextAria'
export { RichTextAreaV2 } from './richTextAria'

export type InputType = typeof InputComponent & {
    Password: typeof Password
    Phone: typeof Phone
    TextArea: typeof TextArea
}

const Input = InputComponent as InputType
Input.Password = Password
Input.Phone = Phone
Input.TextArea = TextArea

export {
    Input,
}