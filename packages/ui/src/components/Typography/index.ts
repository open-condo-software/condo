import { Link } from './link'
import { Paragraph } from './paragraph'
import { Text } from './text'
import { Title } from './title'
import './style.less'

export type { TypographyTitleProps } from './title'
export type { TypographyTextProps } from './text'
export type { TypographyLinkProps } from './link'
export type { TypographyParagraphProps } from './paragraph'
export type TypographyType = {
    Text: typeof Text,
    Title: typeof Title,
    Link: typeof Link,
    Paragraph: typeof Paragraph,
}

const Typography: TypographyType = {
    Text,
    Title,
    Link,
    Paragraph,
}

export {
    Typography,
}