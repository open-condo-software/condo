import { CachePersistor, LocalStorageWrapper } from 'apollo3-cache-persist'
import { createContext, useContext } from 'react'

import { isDebug } from '@open-condo/miniapp-utils/helpers/environment'

import { APOLLO_PERSISTED_CACHE_KEY } from '../constants'

import type { NormalizedCacheObject, ApolloCache } from '@apollo/client'

export type { CachePersistor } from 'apollo3-cache-persist'

export function createPersistor (cache: ApolloCache<NormalizedCacheObject>): CachePersistor<NormalizedCacheObject> {
    return new CachePersistor({
        cache,
        storage: new LocalStorageWrapper(window.localStorage),
        debug: isDebug(),
        key: APOLLO_PERSISTED_CACHE_KEY,
    })
}

type CachePersistorContextType = {
    persistor?: CachePersistor<NormalizedCacheObject>
}

export const CachePersistorContext = createContext<CachePersistorContextType>({})
export function useCachePersistor (): CachePersistorContextType {
    return useContext(CachePersistorContext)
}
