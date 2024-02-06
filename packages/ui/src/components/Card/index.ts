import { Card as CardComponent } from './card'
import './style.less'
import { CheckboxCard } from './checkboxCard'


type CardType = typeof CardComponent & {
    CheckboxCard: typeof CheckboxCard
}

const Card = CardComponent as CardType
Card.CheckboxCard = CheckboxCard

export type { CardProps } from './card'
export type { CheckboxCardProps } from './checkboxCard'
export {
    Card,
}