const MOBILE_SMALL = 'MOBILE_SMALL'
const MOBILE_LARGE = 'MOBILE_LARGE'
const TABLET_SMALL = 'TABLET_SMALL'
const TABLET_LARGE = 'TABLET_LARGE'
const DESKTOP_SMALL = 'DESKTOP_SMALL'
const DESKTOP_LARGE = 'DESKTOP_LARGE'

export const BREAKPOINTS = [MOBILE_SMALL, MOBILE_LARGE, TABLET_SMALL, TABLET_LARGE, DESKTOP_SMALL, DESKTOP_LARGE] as const

export type Breakpoint = typeof BREAKPOINTS[number]
type BreakpointMap = { [Key in Breakpoint]: string }

export type ScreenMap = Partial<Record<Breakpoint, boolean>>

export const responsiveMap: BreakpointMap = {
    MOBILE_SMALL: '(min-width: 0px)',
    MOBILE_LARGE: '(min-width: 360px)',
    TABLET_SMALL: '(min-width: 480px)',
    TABLET_LARGE: '(min-width: 768px)',
    DESKTOP_SMALL: '(min-width: 992px)',
    DESKTOP_LARGE: '(min-width: 1200px)',
}

type SubscribeFunc = (screens: ScreenMap) => void
const subscribers = new Map<number, SubscribeFunc>()
let subUid = -1
let screens = {}

const responsiveObserve = {
    matchHandlers: {} as {
        [prop: string]: {
            mql: MediaQueryList;
            listener: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null;
        };
    },
    dispatch (pointMap: ScreenMap) {
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
    unsubscribe (token: number) {
        subscribers.delete(token)
        if (!subscribers.size) this.unregister()
    },
    unregister () {
        Object.keys(responsiveMap).forEach((screen) => {
            const matchMediaQuery = responsiveMap[screen as Breakpoint]
            const handler = this.matchHandlers[matchMediaQuery]
            handler?.mql.removeListener(handler?.listener)
        })
        subscribers.clear()
    },
    register () {
        Object.keys(responsiveMap).forEach((screen) => {
            const matchMediaQuery = responsiveMap[screen as Breakpoint]
            const listener = ({ matches }: { matches: boolean }) => {
                this.dispatch({
                    ...screens,
                    [screen]: matches,
                })
            }
            const mql = window.matchMedia(matchMediaQuery)
            mql.addListener(listener)
            this.matchHandlers[matchMediaQuery] = {
                mql,
                listener,
            }

            listener(mql)
        })
    },
}

export default responsiveObserve