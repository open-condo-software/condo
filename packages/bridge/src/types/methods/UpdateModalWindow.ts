import type { ShowModalWindowParams } from './ShowModalWindow'

export type UpdateModalWindowParams = Pick<ShowModalWindowParams, 'size' | 'title'> & {
    modalId: string
}

export type UpdateModalWindowData = {
    updated: boolean
}