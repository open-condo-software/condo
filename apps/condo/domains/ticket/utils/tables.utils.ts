import isEmpty from 'lodash/isEmpty'
import isString from 'lodash/isString'
import uniq from 'lodash/uniq'

import { ADDRESS_SEARCH_STOP_WORDS } from '@condo/domains/common/constants'
import { OMIT_SEARCH_CHARACTERS_REGEXP } from '@condo/domains/common/constants/regexps'
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

                if (wrappedDataIndex === 'isRegular') {
                    return {
                        AND: [{
                            'isWarranty': false,
                            'isEmergency': false,
                            'isPaid': false,
                        }],
                    }
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

export const getPropertyScopeFilter = () => {
    return function getWhereQuery (options) {
        if (isEmpty(options)) return

        try {
            if (options) {
                const propertyScopes = options.map(option => JSON.parse(option))
                if (propertyScopes.find(propertyScope => propertyScope.hasAllProperties)) {
                    return {}
                }

                return {
                    property: { id_in: propertyScopes.map(scope => scope.value).flat(1) },
                }
            }
        } catch (e) {
            console.error(e)
        }
    }
}

/**
 * Getting a where query for an address in the search field.
 * All punctuation marks and stop words are removed.
 * Also remove short word (less 3 symbols)
 *
 * @example
 *  search: 'ул. ленина д 1/1'
 *  whereQuery: {
 *      property: {
 *          AND: [
 *              { address_contains_i: 'ленина' },
 *              { address_contains_i: '1/1' },
 *          ],
 *      },
 *  }
 */
export const getFilterAddressForSearch = (): FilterType => {
    return function getWhereQuery (search) {
        if (!search || !isString(search)) return

        const addresses = uniq(search
            .replace(OMIT_SEARCH_CHARACTERS_REGEXP, ' ')
            .split(' ')
            .filter((item) => {
                if (!item || ADDRESS_SEARCH_STOP_WORDS.includes(item.toLowerCase())) return false
                const startWithNumber = !Number.isNaN(Number.parseInt(item))
                return startWithNumber || item.length >= 3
            }))

        if (isEmpty(addresses)) return

        return {
            property: {
                AND: addresses.map(item => ({ address_contains_i: item })),
            },
        }
    }
}
