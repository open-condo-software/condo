import type { ProgressBarAction } from './ShowProgressBar'

export type GetActiveProgressBarsParams = Record<string, never>

export type GetActiveProgressBarData = {
    id: string
    message: string
    description?: string
    progress: number
    externalTaskId?: string
    disableCancel?: boolean
    action?: ProgressBarAction
}

export type GetActiveProgressBarsData = {
    bars: Array<GetActiveProgressBarData>
}