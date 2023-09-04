import { CallRecordFragmentWhereInput, TicketWhereInput } from '@app/condo/schema'
import isEmpty from 'lodash/isEmpty'
import isString from 'lodash/isString'
import uniq from 'lodash/uniq'

import { ADDRESS_SEARCH_STOP_WORDS } from '@condo/domains/common/constants'
import { OMIT_SEARCH_CHARACTERS_REGEXP } from '@condo/domains/common/constants/regexps'
import { DataIndexType, FilterType } from '@condo/domains/common/utils/tables.utils'
import { INCIDENT_STATUS_ACTUAL, INCIDENT_STATUS_NOT_ACTUAL } from '@condo/domains/ticket/constants/incident'


type MultipleDataIndexType = DataIndexType[]
type AttributesFilterGetterType = (dataIndices: MultipleDataIndexType) => FilterType

export const getTicketAttributesFilter: AttributesFilterGetterType = (dataIndices) => {
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

export const getIsIncomingCallFilter = () => {
    return function getWhereQuery (search) {
        if (isEmpty(search)) return

        return {
            callRecord: {
                OR: search.map(isIncomingCall => ({ isIncomingCall: isIncomingCall === 'true' })),
            },
        }
    }
}

export const getCallRecordPhoneFilter = () => {
    return function getWhereQuery (search): CallRecordFragmentWhereInput {
        if (isEmpty(search)) return

        return {
            callRecord: {
                OR: [
                    {
                        AND: [
                            {
                                isIncomingCall: true,
                                callerPhone_contains_i: search,
                            },
                        ],
                    },
                    {
                        AND: [
                            {
                                isIncomingCall: false,
                                destCallerPhone_contains_i: search,
                            },
                        ],
                    },
                ],
            },
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

export const getTicketTypeFilter = (userId) => {
    return function getWhereQuery (option) {
        if (isEmpty(option)) return

        if (option === 'own') {
            return { OR: [{ executor: { id: userId }, assignee: { id: userId } }] }
        }

        if (option === 'favorite') {
            return {}
        }
    }
}

export const getClientNameFilter = () => {
    return function getWhereQuery (search): TicketWhereInput {
        if (isEmpty(search)) return

        return {
            OR: [
                {
                    AND: [
                        {
                            contact_is_null: true,
                            clientName_contains_i: search,
                        },
                    ],
                },
                {
                    contact: { name_contains_i: search },
                },
            ],
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
export const getFilterAddressForSearch = (addressFieldName = 'address'): FilterType => {
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
                AND: addresses.map(item => ({ [`${addressFieldName}_contains_i`]: item })),
            },
        }
    }
}


export const getIncidentAttributesFilter: AttributesFilterGetterType = (dataIndices) => {
    return function getWhereQuery (search) {
        if (!search || search.length === 0 || dataIndices.length === 1) return

        const args = !Array.isArray(search) ? [search] : search

        return {
            OR: dataIndices.map(wrappedDataIndex => {
                if (!args.find(arg => arg === wrappedDataIndex) || !isString(wrappedDataIndex)) return

                if (wrappedDataIndex === INCIDENT_STATUS_ACTUAL) {
                    return { 'status': INCIDENT_STATUS_ACTUAL }
                }

                if (wrappedDataIndex === INCIDENT_STATUS_NOT_ACTUAL) {
                    return { 'status': INCIDENT_STATUS_NOT_ACTUAL }
                }

                return {
                    [wrappedDataIndex]: true,
                }
            }).filter(Boolean),
        }
    }
}
