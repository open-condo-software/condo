type UpdatableParams = {
    message: string
    description: string
    progress: number
    status: 'completed' | 'error'
}

export type UpdateProgressBarParams = {
    barId: string
    data: Partial<UpdatableParams>
}

export type UpdateProgressBarData = {
    updated: boolean
}