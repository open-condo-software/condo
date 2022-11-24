import { version } from '@open-condo/ui/package.json'

type ComponentSpecificClickEventProps = {
    Button: { value: string }
}

type CommonAnalyticsProps = {
    event: 'click',
    location: string,
}

type AnalyticsClickData<K extends keyof ComponentSpecificClickEventProps> = CommonAnalyticsProps & { component: K } & ComponentSpecificClickEventProps[K]

const ANALYTICS_HANDLER_NAME = 'CondoWebSendAnalyticsEvent'

export function sendAnalyticsClickEvent<K extends keyof ComponentSpecificClickEventProps> (component: K, data: ComponentSpecificClickEventProps[K]): void {
    if (typeof window !== 'undefined') {
        const location = window.location.href
        const params: AnalyticsClickData<K> = {
            event: 'click',
            location,
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
}