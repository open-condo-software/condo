import type { ProgressBarActionData } from './ShowProgressBar'

export type GetActiveProgressBarsParams = Record<string, never>

export type GetActiveProgressBarData = {
    id: string
    message: string
    description?: string
    progress: number
    externalTaskId?: string
    actions?: Array<ProgressBarActionData>
}

export type GetActiveProgressBarsData = {
    bars: Array<GetActiveProgressBarData>
}