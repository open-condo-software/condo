import identity from 'lodash/identity'
import isString from 'lodash/isString'
import React from 'react'

import { version } from '@open-condo/ui/package.json'

type AnalyticsEvent = 'click' | 'check'

type CommonAnalyticsProps<Event extends AnalyticsEvent, K> = {
    event: Event,
    location: string,
    component: K
}

type ComponentSpecificClickEventProps = {
    Banner: { title: string }
    Button: { value: string, type: string }
    'Typography.Link': { value: string, href?: string }
}

type ComponentSpecificCheckEventProps = {
    Radio: { value: string }
    Checkbox: { value: string }
}



type AnalyticsClickData<K extends keyof ComponentSpecificClickEventProps> = CommonAnalyticsProps<'click', K> & ComponentSpecificClickEventProps[K]
type AnalyticsCheckData<K extends keyof ComponentSpecificCheckEventProps> = CommonAnalyticsProps<'check', K> & ComponentSpecificCheckEventProps[K]

export type AnalyticsParams = AnalyticsClickData<keyof ComponentSpecificClickEventProps> | AnalyticsCheckData<keyof ComponentSpecificCheckEventProps>

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

export function sendAnalyticsCheckEvent<K extends keyof ComponentSpecificCheckEventProps> (component: K, data: ComponentSpecificCheckEventProps[K]): void {
    if (typeof window !== 'undefined') {
        const location = window.location.href
        const params: AnalyticsCheckData<K> = {
            event: 'check',
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
