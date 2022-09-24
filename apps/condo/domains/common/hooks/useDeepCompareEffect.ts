import type { EffectCallback, DependencyList } from 'react'
import { useEffect } from 'react'
import isEqual from 'lodash/isEqual'
import { usePrevious } from './usePrevious'

export const useDeepCompareEffect = (effect: EffectCallback, deps: DependencyList): void => {
    const previous = usePrevious(deps)
    useEffect(() => {
        if (!isEqual(previous, deps)) {
            effect()
        }
    }, [effect, deps, previous])
}