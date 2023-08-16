import get from 'lodash/get'
import identity from 'lodash/identity'
import isObject from 'lodash/isObject'
import isString from 'lodash/isString'
import React from 'react'

import { version } from '@open-condo/ui/package.json'

type AnalyticsEvent = 'click' | 'check' | 'change'

type CommonComponentProps = {
    id?: string
}

type ComponentSpecificClickEventProps = {
    Banner: { title: string }
    Button: { value: string, type: string }
    'Typography.Link': { value: string, href?: string }
    Dropdown: { optionValue: string, optionKey?: string, optionKeyPath?: Array<string>, triggerValue?: string }
}

type ComponentSpecificCheckEventProps = {
    Radio: { value: string }
    Checkbox: { value: string }
}

type ComponentSpecificChangeEventProps = {
    Tabs: { activeKey: string }
    Steps: { activeStep: number }
    Select: { value: string | Array<string>, label: string | Array<string> }
}

type ComponentNames = {
    click: keyof ComponentSpecificClickEventProps
    check: keyof ComponentSpecificCheckEventProps
    change: keyof ComponentSpecificChangeEventProps
}

type AnyComponentName = ComponentNames[AnalyticsEvent]

type CommonAnalyticsProps<Event extends AnalyticsEvent, Component extends AnyComponentName> = {
    event: Event,
    location: string,
    component: Component
} & CommonComponentProps

type AnalyticsClickEventParams<Component extends ComponentNames['click']> = CommonAnalyticsProps<'click', Component>
& ComponentSpecificClickEventProps[Component]

type AnalyticsCheckEventParams<Component extends ComponentNames['check']> = CommonAnalyticsProps<'check', Component>
& ComponentSpecificCheckEventProps[Component]

type AnalyticsChangeEventParams<Component extends ComponentNames['change']> = CommonAnalyticsProps<'change', Component>
& ComponentSpecificChangeEventProps[Component]

export type AnalyticsParams = AnalyticsClickEventParams<ComponentNames['click']>
| AnalyticsCheckEventParams<ComponentNames['check']>
| AnalyticsChangeEventParams<ComponentNames['change']>

const ANALYTICS_HANDLER_NAME = 'CondoWebSendAnalyticsEvent'

export function extractChildrenContent (children: React.ReactNode | React.ReactInstance): string | null {
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

/**
 * Send analytics click event
 * @param component - component name
 * @param data - click metadata. Should not be a sensitive data
 */
export function sendAnalyticsClickEvent<Component extends ComponentNames['click']> (
    component: Component,
    data: ComponentSpecificClickEventProps[Component] & CommonComponentProps
): void {
    if (typeof window !== 'undefined') {
        const location = window.location.href
        const params: AnalyticsClickEventParams<Component> = {
            event: 'click',
            location,
            component,
            ...data,
        }
        // used only for non-sensitive click metadata delivery to container
        // nosemgrep: javascript.browser.security.wildcard-postmessage-configuration.wildcard-postmessage-configuration
        parent.postMessage({
            handler: ANALYTICS_HANDLER_NAME,
            params,
            type: 'condo-ui',
            version,
        }, '*')
    }
}

/**
 * Send analytics click event
 * @param component - component name
 * @param data - click metadata. Should not be a sensitive data
 */
export function sendAnalyticsCheckEvent<Component extends ComponentNames['check']> (
    component: Component,
    data: ComponentSpecificCheckEventProps[Component] & CommonComponentProps
): void {
    if (typeof window !== 'undefined') {
        const location = window.location.href
        const params: AnalyticsCheckEventParams<Component> = {
            event: 'check',
            location,
            component,
            ...data,
        }

        // used only for non-sensitive click metadata delivery to container
        // nosemgrep: javascript.browser.security.wildcard-postmessage-configuration.wildcard-postmessage-configuration
        parent.postMessage({
            handler: ANALYTICS_HANDLER_NAME,
            params,
            type: 'condo-ui',
            version,
        }, '*')
    }
}

/**
 * Send analytics click event
 * @param component - component name
 * @param data - click metadata. Should not be a sensitive data
 */
export function sendAnalyticsChangeEvent<Component extends ComponentNames['change']> (
    component: Component,
    data: ComponentSpecificChangeEventProps[Component] & CommonComponentProps
): void {
    if (typeof window !== 'undefined') {
        const location = window.location.href
        const params: AnalyticsChangeEventParams<Component> = {
            event: 'change',
            location,
            component,
            ...data,
        }
        // used only for non-sensitive click metadata delivery to container
        // nosemgrep: javascript.browser.security.wildcard-postmessage-configuration.wildcard-postmessage-configuration
        parent.postMessage({
            handler: ANALYTICS_HANDLER_NAME,
            params,
            type: 'condo-ui',
            version,
        }, '*')
    }
}
