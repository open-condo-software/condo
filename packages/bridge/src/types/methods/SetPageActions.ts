export type Action = {
    label?: string
    icon?: string
    disabled?: boolean
    loading?: boolean
}

export type SetPageActionsParams = {
    actions: Array<Action>
}

export type SetPageActionsData = {
    actionIds: Array<string>
}
