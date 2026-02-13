export type ButtonAction = {
    key: string
    label?: string
    icon?: 'download'
    type?: 'primary' | 'secondary' | 'accent'
    disabled?: boolean
    loading?: boolean
}

export type Action = ButtonAction


export type SetActionsConfigParams = {
    actions: Array<Action>
}

export type SetActionsConfigData = {
    actionsIds: Array<string>
}
