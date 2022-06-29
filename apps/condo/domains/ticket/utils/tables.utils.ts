import { isEmpty } from 'lodash'
import isString from 'lodash/isString'

import { DataIndexType, FilterType } from '@condo/domains/common/utils/tables.utils'

type MultipleDataIndexType = DataIndexType[]
type TicketAttributesFilterGetterType = (dataIndices: MultipleDataIndexType) => FilterType

export const getTicketAttributesFilter: TicketAttributesFilterGetterType = (dataIndices) => {
    return function getWhereQuery (search) {
        if (!search || search.length === 0 || dataIndices.length === 1) return

        const args = !Array.isArray(search) ? [search] : search

        return {
            OR: dataIndices.map(wrappedDataIndex => {
                if (!args.find(arg => arg === wrappedDataIndex) || !isString(wrappedDataIndex)) return

                if (wrappedDataIndex === 'statusReopenedCounter') {
                    return { [`${wrappedDataIndex}_gt`]: 0 }
                }

                return {
                    [wrappedDataIndex]: true,
                }
            }).filter(Boolean),
        }
    }
}

export const getIsResidentContactFilter = () => {
    return function getWhereQuery (search) {
        if (isEmpty(search)) return

        return {
            OR: search.map(contactTypeValue => ({ contact_is_null: contactTypeValue === 'true' })),
        }
    }
}