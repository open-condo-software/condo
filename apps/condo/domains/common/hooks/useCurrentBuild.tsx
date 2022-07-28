import useSWR from 'swr'
import get from 'lodash/get'
import getConfig from 'next/config'

const {
    publicRuntimeConfig: { serverUrl },
} = getConfig()

const REQUEST_KEY = '/api/version'
const API_ROUTE = `${serverUrl}${REQUEST_KEY}`

async function fetchBuildInfo () {
    const response = await fetch(API_ROUTE)
    return await response.json()
}

export function useCurrentBuild (): string {
    const { data } = useSWR(REQUEST_KEY, fetchBuildInfo)

    return get(data, 'build', null)
}
