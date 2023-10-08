export type GetActiveProgressBarsParams = Record<string, never>

export type GetActiveProgressBarData = {
    id: string
    message: string
    description?: string
    progress: number
    externalTaskId?: string
}

export type GetActiveProgressBarsData = {
    bars: Array<GetActiveProgressBarData>
}