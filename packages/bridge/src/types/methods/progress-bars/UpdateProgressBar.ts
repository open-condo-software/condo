import type { ProgressBarAction } from './ShowProgressBar'

type UpdatableParams = {
    message: string
    description: string
    progress: number
    disableCancel: boolean
    status: 'completed' | 'error'
    action: ProgressBarAction
}

export type UpdateProgressBarParams = {
    barId: string
    data: Partial<UpdatableParams>
}

export type UpdateProgressBarData = {
    updated: boolean
}