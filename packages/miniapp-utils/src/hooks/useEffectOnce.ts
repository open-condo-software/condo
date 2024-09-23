// SRC: https://github.com/streamich/react-use/blob/master/src/useEffectOnce.ts

import { EffectCallback, useEffect } from 'react'

/**
 * useEffect wrapper, that runs side effect only once on initial component render
 * @example
 * useEffectOnce(() => {
 *     initAnalytics()
 * })
 */
export function useEffectOnce (cb: EffectCallback): void {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(cb, [])
}
