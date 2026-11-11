import type { ShowModalWindowParams } from '../modals/ShowModalWindow'

export type ProgressBarLinkAction = {
    type: 'link'
    label: string
    url: string
}

export type ProgressBarModalAction = {
    type: 'modal'
    label: string
    modal: ShowModalWindowParams
}

export type ProgressBarAction = ProgressBarLinkAction | ProgressBarModalAction

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
