import get from 'lodash/get'
import identity from 'lodash/identity'
import isObject from 'lodash/isObject'
import isString from 'lodash/isString'
import React from 'react'

import { version } from '@open-condo/ui/package.json'

type AnalyticsEvent = 'click' | 'check' | 'select'

type ComponentCommonEventProps = {
    id?: string
}

type CommonAnalyticsProps<Event extends AnalyticsEvent, K> = {
    event: Event,
    location: string,
    component: K
} & ComponentCommonEventProps

type ComponentSpecificClickEventProps = {
    Banner: { title: string }
    Button: { value: string, type: string }
    'Typography.Link': { value: string, href?: string }
}

type ComponentSpecificCheckEventProps = {
    Radio: { value: string }
    Checkbox: { value: string }
}

type ComponentSpecificSelectEventProps = {
    Select: { value: string, label: string }
}

type ComponentClickData<K extends keyof ComponentSpecificClickEventProps> = ComponentSpecificClickEventProps[K] & ComponentCommonEventProps
type ComponentCheckData<K extends keyof ComponentSpecificCheckEventProps> = ComponentSpecificCheckEventProps[K] & ComponentCommonEventProps
type ComponentSelectData<K extends keyof ComponentSpecificSelectEventProps> = ComponentSpecificSelectEventProps[K] & ComponentCommonEventProps


type AnalyticsClickData<K extends keyof ComponentSpecificClickEventProps> = CommonAnalyticsProps<'click', K>
& ComponentSpecificClickEventProps[K]
type AnalyticsCheckData<K extends keyof ComponentSpecificCheckEventProps> = CommonAnalyticsProps<'check', K>
& ComponentSpecificCheckEventProps[K]
type AnalyticsSelectData<K extends keyof ComponentSpecificSelectEventProps> = CommonAnalyticsProps<'select', K>
& ComponentSpecificSelectEventProps[K]

export type AnalyticsParams = AnalyticsClickData<keyof ComponentSpecificClickEventProps>
| AnalyticsCheckData<keyof ComponentSpecificCheckEventProps>
| AnalyticsSelectData<keyof ComponentSpecificSelectEventProps>

const ANALYTICS_HANDLER_NAME = 'CondoWebSendAnalyticsEvent'

export function extractChildrenContent (children: React.ReactNode): string | null {
    if (isString(children)) {
        return children
    } else if (Array.isArray(children)) {
        const stringChildren = children.map(extractChildrenContent).filter(identity)
        if (stringChildren.length) {
            return stringChildren.join(':')
        }
    } else if (isObject(children)) {
        const childrenContent = get(children, ['props', 'children'], null)
        return extractChildrenContent(childrenContent)
    }

    return null
}

export function sendAnalyticsClickEvent<K extends keyof ComponentSpecificClickEventProps> (component: K, data: ComponentClickData<K>): void {
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

export function sendAnalyticsCheckEvent<K extends keyof ComponentSpecificCheckEventProps> (component: K, data: ComponentCheckData<K>): void {
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

export function sendAnalyticsSelectEvent<K extends keyof ComponentSpecificSelectEventProps> (component: K, data: ComponentSelectData<K>): void {
    if (typeof window !== undefined) {
        const location = window.location.href
        const params: AnalyticsSelectData<K> = {
            event: 'select',
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
