import identity from 'lodash/identity'
import isString from 'lodash/isString'
import React from 'react'

import { version } from '@open-condo/ui/package.json'

type ComponentSpecificClickEventProps = {
    Banner: { title: string }
    Button: { value: string, type: string }
    'Typography.Link': { value: string, href?: string }
}

type CommonAnalyticsProps<K> = {
    event: 'click',
    location: string,
    component: K
}

type AnalyticsClickData<K extends keyof ComponentSpecificClickEventProps> = CommonAnalyticsProps<K> & ComponentSpecificClickEventProps[K]

export type AnalyticsParams = AnalyticsClickData<keyof ComponentSpecificClickEventProps>

const ANALYTICS_HANDLER_NAME = 'CondoWebSendAnalyticsEvent'

export function extractChildrenContent (children: React.ReactNode): string | null {
    if (isString(children)) {
        return children
    } else if (Array.isArray(children)) {
        const stringChildren = children.map(extractChildrenContent).filter(identity)
        if (stringChildren.length) {
            return stringChildren.join(':')
        }
    }

    return null
}

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