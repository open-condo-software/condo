import isEqual from 'lodash/isEqual'
import { useEffect } from 'react'

import { usePrevious } from './usePrevious'

import type { EffectCallback, DependencyList } from 'react'

export const useDeepCompareEffect = (effect: EffectCallback, deps: DependencyList): void => {
    const previous = usePrevious(deps)
    useEffect(() => {
        if (!isEqual(previous, deps)) {
            effect()
        }
    }, [effect, deps, previous])
}