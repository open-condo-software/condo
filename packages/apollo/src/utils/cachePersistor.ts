import { CachePersistor, LocalStorageWrapper } from 'apollo3-cache-persist'
import { createContext, useContext } from 'react'

import { isDebug } from '@open-condo/miniapp-utils/helpers/environment'

import { APOLLO_PERSISTED_CACHE_KEY } from '../constants'

import type { NormalizedCacheObject, ApolloCache } from '@apollo/client'

export type { CachePersistor } from 'apollo3-cache-persist'

/**
 * Creates new cache persistor, which links localStorage with existing cache
 * @example
 * const loaderPersistor = createPersistor(cache)
 * await loaderPersistor.restore() // cache will be filled with localStorage data
 * await loaderPersistor.persist() // localStorage will be filled with cache data
 */
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

/**
 * Basic React Context to pass persistor, obtained from useApollo hook down to your application
 * @example
 * const { client, cachePersistor } = useApollo(pageProps)
 *
 * return (
 *      <ApolloProvider client={client}>
 *          <CachePersistorContext.Provider value={{ persistor: cachePersistor }}>
 *              <Component {...pageProps} />
 *          <CachePersistorContext.Provider/>
 *      <ApolloProvider/>
 * )
 */
export const CachePersistorContext = createContext<CachePersistorContextType>({})

/**
 * Basic react context consumer, which can be used, to obtain persistor in your app logic
 * @example
 * const { persistor } = useCachePersistor()
 * const { data: readingData, loading: readingLoading } = useGetLatestMeterReadingQuery({
 *     variables: {
 *         meterId: meter.id,
 *     },
 *     onError,
 *     skip: !persistor, // Don't fetch data while localStorage is loading (no persistor), since it can be cached there
 * })
 */
export function useCachePersistor (): CachePersistorContextType {
    return useContext(CachePersistorContext)
}
