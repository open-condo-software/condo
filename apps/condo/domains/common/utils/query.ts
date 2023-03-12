import get from 'lodash/get'
import qs from 'qs'

export const getObjectValueFromQuery = (router, path = []) => {
    try {
        const query = get(router, ['query', ...path])
        if (!query) return {}
        const initialValuesFromQuery = JSON.parse(query)

        if (initialValuesFromQuery) {
            return qs.parse(initialValuesFromQuery)
        }
    } catch (e) {
        console.error(e)
    }

    return {}
}
