import { Analytics as DefaultAnalytics } from 'analytics'

import { GroupingMiddlewarePlugin, IdentityMiddlewarePlugin } from './middlewares'

import type { AnyPayload, AnalyticsConfig, AnalyticsInstanceWithGroups, PageData } from './types'

/**
 * Type-safe wrapper on top of "[analytics](https://www.npmjs.com/package/analytics)" npm package
 * with support of group method (Posthog inspired) to group users into cohorts
 *
 * @example Init analytics in your app with type-guards
 * import { Analytics } from '@open-condo/miniapp-utils/helpers/analytics'
 * import { isDebug } from '@open-condo/miniapp-utils/helpers/environment'
 *
 * type MyAppEvents = {
 *     'order_create': { orderId: string, itemIds: Array<string> }
 *     'user_register': { userId: string, utmSource?: string  }
 * }
 *
 * type MyUserData = {
 *     'name'?: string
 *     'age'?: number
 * }
 *
 * type MyAppGroups = 'organization' | 'country'
 *
 * export const analytics = new Analytics<MyAppEvents, MyUserData, MyAppGroups>({
 *     app: appName,
 *     version: revision,
 *     debug: isDebug(),
 * })
 *
 * @example Use initialized analytics in your-app
 * import { Router } from 'next/router'
 * import { useEffect } from 'react'
 *
 * import { isValidCondoUIMessage } from '@open-condo/ui/events'
 *
 * import { analytics } from '@/domains/common/utils/analytics'
 * import { useAuth } from '@/domains/user/utils/auth'
 *
 * import type { FC } from 'react'
 *
 * export const ResidentAppEventsHandler: FC = () => {
 *     const user = useAuth()
 *     const { activeResident } = useActiveResident()
 *
 *     // User change tracking
 *     useEffect(() => {
 *         if (user) {
 *             analytics.identify(user.id, { name: user.name, type: user.type })
 *         }
 *     }, [user])
 *
 *     // Page views tracking
 *     useEffect(() => {
 *         const handleRouteChange = () => analytics.pageView()
 *         Router.events.on('routeChangeComplete', handleRouteChange)
 *
 *         return () => {
 *             Router.events.off('routeChangeComplete', handleRouteChange)
 *         }
 *     }, [])
 *
 *     // Condo UI events tracking
 *     useEffect(() => {
 *         if (typeof window !== 'undefined') {
 *             const handleMessage = async (e: MessageEvent) => {
 *                 if (isValidCondoUIMessage(e)) {
 *                     const { params: { event, ...eventData } } = e.data
 *                     await analytics.trackUntyped(event, eventData)
 *                 }
 *
 *             }
 *
 *             window.addEventListener('message', handleMessage)
 *
 *             return () => {
 *                 window.removeEventListener('message', handleMessage)
 *             }
 *         }
 *     }, [])
 *
 *     return null
 * }
 */
export class Analytics<
    Events extends Record<string, AnyPayload> = Record<string, never>,
    UserData extends AnyPayload = Record<string, never>,
    GroupNames extends string = never,
> {
    private readonly _analytics: AnalyticsInstanceWithGroups<GroupNames>
    private readonly _groups = new Set<GroupNames>()

    constructor (config: AnalyticsConfig) {
        this._analytics = DefaultAnalytics({
            ...config,
            plugins: [
                IdentityMiddlewarePlugin,
                GroupingMiddlewarePlugin,
                ...(config.plugins || []),
            ],
        }) as AnalyticsInstanceWithGroups<GroupNames>
        this._analytics.groups = this._groups
    }

    /**
     * Tracks type-safe business events. Recommended to use in most cases in app's codebase.
     * To add an event, modify "Events" generic.
     */
    async track<EventName extends Extract<keyof Events, string>>(eventName: EventName, eventData: Events[EventName]): Promise<void> {
        await this._analytics.track(eventName, eventData)
    }

    /**
     * Tracks untyped analytics events, used mainly for external sources (bridge / ui-kit / messages, etc.)
     * @deprecated It's not recommended to use this in your business logic, consider using typed "track" instead
     */
    async trackUntyped (eventName: string, eventData: AnyPayload): Promise<void> {
        await this._analytics.track(eventName, eventData)
    }

    /**
     * Tracks page changing in SPAs
     */
    async pageView (data?: PageData): Promise<void> {
        await this._analytics.page(data)
    }

    /**
     * Identifies user in analytics provider.
     * To specify all possible shape of user's data, modify "UserData" generic
     *
     * NOTE: Analytics plugins don't have a fixed behavior on how to handle consecutive identify calls.
     * Some of them affect only subsequent events, others affect all user events.
     * Therefore, it is not recommended to put cohort-specific data (organization, address, language, etc.) here.
     * Instead, use something like "group" method if your plugins supports it.
     */
    async identify<Key extends keyof UserData> (userId: string, userData?: Pick<UserData, Key>): Promise<void> {
        await this._analytics.identify(userId, userData)
    }

    /**
     * Resets analytics providers
     */
    async reset (): Promise<void> {
        for (const groupName of this._groups) {
            const groupKey = Analytics.getGroupKey(groupName)
            this._analytics.storage.removeItem(groupKey)
        }
        this._groups.clear()
        await this._analytics.reset()
    }

    static getGroupKey (groupName: string): string {
        return ['analytics', 'groups', groupName].join(':')
    }

    /**
     * Associates the user with a group, adding the attributes `groups.${groupName} = groupId`
     * to all subsequent analytic queries for the user
     * @example
     * analytics.setGroup('organization', organizationId)
     */
    setGroup (groupName: GroupNames, groupId: string): void {
        const groupKey = Analytics.getGroupKey(groupName)
        this._groups.add(groupName)
        this._analytics.storage.setItem(groupKey, groupId)
    }

    /**
     * Removes the current user from the group, stripping the “groups.${groupName}”
     * attribute from all subsequent eventualities
     * @example
     * deleteOrganization()
     *     .then(() => analytics.removeGroup('organization'))
     */
    removeGroup (groupName: GroupNames): void {
        const groupKey = Analytics.getGroupKey(groupName)
        this._analytics.storage.removeItem(groupKey)
        this._groups.delete(groupName)
    }
}
