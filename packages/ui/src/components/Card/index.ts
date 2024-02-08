import { Card as CardComponent } from './card'
import './style.less'
import { CardButton } from './cardButton'
import { CardCheckbox } from './cardCheckbox'


type CardType = typeof CardComponent & {
    CardCheckbox: typeof CardCheckbox
    CardButton: typeof CardButton
}

const Card = CardComponent as CardType
Card.CardCheckbox = CardCheckbox
Card.CardButton = CardButton

export type { CardProps } from './card'
export type { CardCheckboxProps } from './cardCheckbox'
export type { CardButtonProps } from './cardButton'
export {
    Card,
}