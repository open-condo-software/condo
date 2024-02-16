import { CardButton } from './button/cardButton'
import { Card as CardComponent } from './card'
import './style.less'
import { CardCheckbox } from './checkbox/cardCheckbox'


type CardType = typeof CardComponent & {
    CardCheckbox: typeof CardCheckbox
    CardButton: typeof CardButton
}

const Card = CardComponent as CardType
Card.CardCheckbox = CardCheckbox
Card.CardButton = CardButton

export type { CardProps } from './card'
export type { CardCheckboxProps } from './checkbox/cardCheckbox'
export type { CardButtonProps } from './button/cardButton'
export {
    Card,
}