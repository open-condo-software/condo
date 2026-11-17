export type ProgressBarAction = {
    label: string
    actionId: string
}

export type ProgressBarBackground = {
    url: string
}

export type ShowProgressBarParams = {
    message: string
    description?: string
    externalTaskId?: string
    disableCancel?: boolean
    background?: ProgressBarBackground
    action?: ProgressBarAction
}

export type ShowProgressBarData = {
    barId: string
}
