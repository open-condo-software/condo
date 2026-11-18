export type ProgressBarAction = {
    label: string
}

export type ProgressBarActionData = ProgressBarAction & {
    id: string
}

export type ProgressBarProcessingFrame = {
    url: string
}

export type ShowProgressBarParams = {
    message: string
    description?: string
    externalTaskId?: string
    processingFrame?: ProgressBarProcessingFrame
    actions?: Array<ProgressBarAction>
}

export type ShowProgressBarData = {
    barId: string
    actionIds: Array<string>
}
