export type ShowModalWindowParams = {
    title: string
    url: string
    size?: 'small' | 'big'
    height?: number
    fill?: boolean
}

export type ShowModalWindowData = {
    modalId: string
}