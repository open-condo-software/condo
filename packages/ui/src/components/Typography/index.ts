import { Title } from './title'
import { Text } from './text'
import './style.less'

export type { TypographyTitleProps } from './title'
export type { TypographyTextProps } from './text'
export type TypographyType = {
    Text: typeof Text,
    Title: typeof Title,
}

const Typography: TypographyType = {
    Text,
    Title,
}

export {
    Typography,
}