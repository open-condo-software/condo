import get from 'lodash/get'
import isObject from 'lodash/isObject'
import isString from 'lodash/isString'

import { FilterType } from '@condo/domains/common/utils/tables.utils'
import {
    APARTMENT_UNIT_TYPE,
    COMMERCIAL_UNIT_TYPE,
    FLAT_UNIT_TYPE,
    PARKING_UNIT_TYPE,
    WAREHOUSE_UNIT_TYPE,
} from '@condo/domains/property/constants/common'

import type { ResolvedIntlConfig } from 'react-intl'


const UNIT_TYPES_BY_TRANSLATION_KEYS = {
    'field.UnitType.prefix.flat': FLAT_UNIT_TYPE,
    'field.UnitType.prefix.parking': PARKING_UNIT_TYPE,
    'field.UnitType.prefix.apartment': APARTMENT_UNIT_TYPE,
    'field.UnitType.prefix.warehouse': WAREHOUSE_UNIT_TYPE,
    'field.UnitType.prefix.commercial': COMMERCIAL_UNIT_TYPE,
}

export const getUnitFilter = (translations: ResolvedIntlConfig['messages']): FilterType => (search) => {
    if (!isObject(translations)) return
    if (!isString(search)) return

    const [typeOrNumber, ...nameParts] = search.trim().split(' ')
    if (!typeOrNumber) return

    const translationKey = Object.keys(UNIT_TYPES_BY_TRANSLATION_KEYS)
        .find((key) => {
            const keyTranslation = get(translations, key)
            if (!keyTranslation) return false
            return typeOrNumber.toLowerCase() === (keyTranslation as string).toLowerCase()
        })

    const unitType = UNIT_TYPES_BY_TRANSLATION_KEYS[translationKey]

    const unitName = (unitType ? nameParts : [typeOrNumber, ...nameParts]).join(' ')
    if (!unitName) return

    return {
        unitName_i: unitName,
        ...(unitType ? { unitType: unitType } : {}),
    }
}
