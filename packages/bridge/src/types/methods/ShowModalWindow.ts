export type ShowModalWindowParams = {
    title: string
    url: string
    size?: 'small' | 'big'
    initialHeight?: number
}

export type ShowModalWindowData = {
    modalId: string
}