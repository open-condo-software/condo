import { version } from '@open-condo/ui/package.json'

type ComponentSpecificClickEventProps = {
    Button: { value: string }
}

type AnalyticsClickData<K extends keyof ComponentSpecificClickEventProps> = {
    event: 'click'
    component: K,
} & ComponentSpecificClickEventProps[K]

const ANALYTICS_HANDLER_NAME = 'CondoWebSendAnalyticsEvent'

export function sendAnalyticsClickEvent<K extends keyof ComponentSpecificClickEventProps> (component: K, data: ComponentSpecificClickEventProps[K]): void {
    const params: AnalyticsClickData<K> = {
        event: 'click',
        component,
        ...data,
    }
    parent.postMessage({
        handler: ANALYTICS_HANDLER_NAME,
        params,
        type: 'condo-ui',
        version,
    }, '*')
}