import { TabPaneProps } from 'antd'

export type SettingsTabPaneDescriptor = TabPaneProps & {
    key: string,
    title: string,
    content?: React.ReactElement
    eventName?: string
    onClick?: (e) => void
}
