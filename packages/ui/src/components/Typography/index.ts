import { Title } from './title'
import { Text } from './text'
import { Link } from './link'
import './style.less'

export type { TypographyTitleProps } from './title'
export type { TypographyTextProps } from './text'
export type { TypographyLinkProps } from './link'
export type TypographyType = {
    Text: typeof Text,
    Title: typeof Title,
    Link: typeof Link,
}

const Typography: TypographyType = {
    Text,
    Title,
    Link,
}

export {
    Typography,
}