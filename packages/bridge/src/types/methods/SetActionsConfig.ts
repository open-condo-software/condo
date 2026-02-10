export type ButtonAction = {
    label: string
    key: string
    type?: 'primary' | 'secondary' | 'accent'
    visible?: boolean
    disabled?: boolean
    danger?: boolean
    loading?: boolean
    icon?: 'download'
    iconSize?: 'auto' | 'large' | 'medium' | 'small'
    size?: 'medium' | 'large'
    compact?: boolean
    minimal?: boolean
}

export type Action = ButtonAction


export type SetActionsConfigParams = {
    visible: boolean
    actions: Array<Action>
}

export type SetActionsConfigData = {
    actionsIds: Array<string>
}
