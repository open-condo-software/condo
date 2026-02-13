export type ButtonAction = {
    label?: string
    icon?: string
    disabled?: boolean
    loading?: boolean
}

export type Action = ButtonAction


export type SetActionsConfigParams = {
    actions: Array<Action>
}

export type SetActionsConfigData = {
    actionIds: Array<string>
}
