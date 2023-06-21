import type { ShowModalWindowParams } from './ShowModalWindow'

export type UpdateModalWindowParams = {
    modalId: string
    data: Partial<Pick<ShowModalWindowParams, 'size' | 'title'>>
}

export type UpdateModalWindowData = {
    updated: boolean
}