// import { DivisionWhereInput } from "@condo/schema"
import { get } from 'lodash'
import { DivisionWhereInput } from '../../../schema'
import { IFilters } from '../../contact/utils/helpers'

export const searchToQuery = (search?: string): DivisionWhereInput[] => {
    if (!search) {
        return
    }

    return [
        { properties_some: { address_contains_i:  search } },
    ]
}
export const filtersToQuery = (filters: IFilters): DivisionWhereInput => {
    const address = get(filters, 'address')
    const search = get(filters, 'search')

    const searchQuery = searchToQuery(search)

    const filtersCollection = [
        address && { address_contains_i: address },
        searchQuery && { OR: searchQuery },
    ].filter(Boolean)
    if (filtersCollection.length > 0) {
        return {
            AND: filtersCollection,
        }
    }
}