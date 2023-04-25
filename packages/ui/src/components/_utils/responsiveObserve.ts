const MOBILE_SMALL = 'MOBILE_SMALL'
const MOBILE_SMALL_MIN_WIDTH = 0
const MOBILE_LARGE = 'MOBILE_LARGE'
const MOBILE_LARGE_MIN_WIDTH = 360
const TABLET_SMALL = 'TABLET_SMALL'
const TABLET_SMALL_MIN_WIDTH = 480
const TABLET_LARGE = 'TABLET_LARGE'
const TABLET_LARGE_MIN_WIDTH = 768
const DESKTOP_SMALL = 'DESKTOP_SMALL'
const DESKTOP_SMALL_MIN_WIDTH = 992
const DESKTOP_LARGE = 'DESKTOP_LARGE'
const DESKTOP_LARGE_MIN_WIDTH = 1200

export const BREAKPOINTS = {
    [MOBILE_SMALL]: MOBILE_SMALL_MIN_WIDTH,
    [MOBILE_LARGE]: MOBILE_LARGE_MIN_WIDTH,
    [TABLET_SMALL]: TABLET_SMALL_MIN_WIDTH,
    [TABLET_LARGE]: TABLET_LARGE_MIN_WIDTH,
    [DESKTOP_SMALL]: DESKTOP_SMALL_MIN_WIDTH,
    [DESKTOP_LARGE]: DESKTOP_LARGE_MIN_WIDTH,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

export type ScreenMap = Partial<Record<Breakpoint, boolean>>

function getMediaQuery (minWidth: number) {
    return `(min-width: ${minWidth}px)`
}

type SubscribeFunc = (screens: ScreenMap) => void
const subscribers = new Map<number, SubscribeFunc>()
let subUid = -1
let screens = {}

type MediaQueryListListener = (this: MediaQueryList, event: MediaQueryListEvent) => void

const responsiveObserve = {
    matchHandlers: {} as {
        [prop: string]: {
            mql: MediaQueryList
            listener: MediaQueryListListener
        };
    },
    dispatch (pointMap: ScreenMap): boolean {
        screens = pointMap
        subscribers.forEach(func => func(screens))
        return subscribers.size >= 1
    },
    subscribe (func: SubscribeFunc): number {
        if (!subscribers.size) this.register()
        subUid += 1
        subscribers.set(subUid, func)
        func(screens)
        return subUid
    },
    unsubscribe (token: number): void {
        subscribers.delete(token)
        if (!subscribers.size) this.unregister()
    },
    unregister (): void {
        Object.values(BREAKPOINTS).forEach((breakpoint) => {
            const matchMediaQuery = getMediaQuery(breakpoint)
            const handler = this.matchHandlers[matchMediaQuery]
            handler?.mql.removeEventListener('change', handler?.listener)
        })
        subscribers.clear()
    },
    register (): void {
        Object.keys(BREAKPOINTS).forEach((screen) => {
            const matchMediaQuery = getMediaQuery(BREAKPOINTS[screen as Breakpoint])
            const listener = ({ matches }: { matches: boolean }) => {
                this.dispatch({
                    ...screens,
                    [screen]: matches,
                })
            }
            const mql = window.matchMedia(matchMediaQuery)
            mql.addEventListener('change', listener)
            this.matchHandlers[matchMediaQuery] = {
                mql,
                listener,
            }

            listener(mql)
        })
    },
}

export default responsiveObserve