
type ActionBarAction = {
    id: string
    label: string
    type?: 'primary' | 'secondary' | 'accent'
    loading?: boolean
    disabled?: boolean
    icon?: 'download'
    iconSize?: 'auto' | 'large' | 'medium' | 'small'
}

export type SetActionBarConfigParams = {
    visible: boolean
    actions: Array<ActionBarAction>
    message?: string
}

export type SetActionBarConfigData = {
    success: boolean
}