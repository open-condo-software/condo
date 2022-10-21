import isString from 'lodash/isString'
import { DataIndexType, FilterType } from '../../common/utils/tables.utils'

type MultipleDataIndexType = DataIndexType[]
type ContactAttributesFilterGetterType = (dataIndices: MultipleDataIndexType) => FilterType

export const getContactAttributesFilter: ContactAttributesFilterGetterType = (dataIndices) => {
    return function getWhereQuery (search) {
        if (!search || search.length === 0 || dataIndices.length === 0) return

        const args = !Array.isArray(search) ? [search] : search

        return {
            OR: dataIndices.map(wrappedDataIndex => {
                if (!args.find(arg => arg === wrappedDataIndex) || !isString(wrappedDataIndex)) return

                return {
                    [wrappedDataIndex]: true,
                }
            }).filter(Boolean),
        }
    }
}