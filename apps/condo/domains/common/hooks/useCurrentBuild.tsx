import get from 'lodash/get'
import getConfig from 'next/config'
import useSWR from 'swr'

const {
    publicRuntimeConfig: { serverUrl },
} = getConfig()

const REQUEST_CACHE_KEY = '/api/version'
const FETCH_ROUTE = `${serverUrl}/api/version`

async function fetchBuildInfo () {
    const response = await fetch(FETCH_ROUTE)
    return await response.json()
}

/**
 * Fetch data about current build from a remote url using useSWR under the hood
 * Which is similar to useQuery from "apollo-client"
 * It has cache-validating mechanism:
 * 1. Return value from cache by specified key
 * 2. Fetch data from remote url and compare with cache value
 * 3. Update return value if needed
 */
export function useCurrentBuild (): string {
    const { data } = useSWR(REQUEST_CACHE_KEY, fetchBuildInfo)

    return get(data, 'build', null)
}
