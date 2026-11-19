import type { ProgressBarAction } from './ShowProgressBar'

type UpdatableParams = {
    message: string
    description: string
    progress: number
    status: 'completed' | 'error'
    actions: Array<ProgressBarAction>
}

export type UpdateProgressBarParams = {
    barId: string
    data: Partial<UpdatableParams>
}

export type UpdateProgressBarData = {
    updated: boolean
    actionIds: Array<string>
}