import get from 'lodash/get'
import qs from 'qs'

export const getObjectValueFromQuery = (router, path = []) => {
    try {
        const initialValuesFromQuery = JSON.parse(get(router, ['query', ...path]))

        if (initialValuesFromQuery) {
            return qs.parse(initialValuesFromQuery)
        }
    } catch (e) {
        console.error(e)
    }

    return {}
}