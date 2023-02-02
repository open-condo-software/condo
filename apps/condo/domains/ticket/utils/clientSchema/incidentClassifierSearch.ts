import {
    IncidentClassifier,
    IncidentClassifierWhereInput,
    QueryAllIncidentClassifiersArgs,
} from '@app/condo/schema'
import { filter, isEmpty, sortBy } from 'lodash'

import { ApolloClient } from '@open-condo/next/apollo'

import { IncidentClassifier as IncidentClassifierGQL } from '@condo/domains/ticket/gql'


export type Option = {
    id: string
    name: string
}

export type IncidentClassifierWhereInputType = Pick<IncidentClassifierWhereInput, 'organization' | 'organization_is_null' | 'category' | 'problem' | 'id'>

export interface IClassifiersSearch {
    init: () => Promise<void>
    rulesToOptions: (rules: IncidentClassifier[], type: string) => Option[]
    findRules: (query: IncidentClassifierWhereInputType) => Promise<IncidentClassifier[]>
    search: (input: string, type: string, variables: QueryAllIncidentClassifiersArgs) => Promise<Option[]>
}

interface ILoadClassifierRulesVariables {
    where?: IncidentClassifierWhereInputType
    skip?: number
    first?: number
    sortBy?: string
}

const MAX_SEARCH_COUNT = 20

async function loadClassifierRules (client: ApolloClient, variables: ILoadClassifierRulesVariables): Promise<IncidentClassifier[]> {
    const data = await client.query({
        query: IncidentClassifierGQL.GET_ALL_OBJS_QUERY,
        variables,
    })
    return data.data.objs
}

export class IncidentClassifiersQueryLocal implements IClassifiersSearch {

    constructor (private client: ApolloClient, private rules = [], private category = [], private problem = []) {}

    public async init (): Promise<void> {
        if (this.rules && this.rules.length) {
            return
        }
        let skip = 0
        let maxCount = 200
        let newchunk = []
        let allRules = []
        do {
            newchunk = await loadClassifierRules(this.client, { first: 50, skip: skip, sortBy: 'id_ASC' })
            allRules = allRules.concat(newchunk)
            skip += newchunk.length
        } while (--maxCount > 0 && newchunk.length)
        this.rules = allRules
        this.category = this.rulesToOptions(allRules, 'category')
        this.problem = this.rulesToOptions(allRules, 'problem')
    }

    public rulesToOptions (data: IncidentClassifier[], field: string): Option[] {
        const fromRules = Object.fromEntries(data.map(link => {
            if (link[field]) {
                return [link[field].id, link[field]]
            } else {
                return [null, { id: null, name: '' }]
            }
        }))
        if (isEmpty(fromRules)) {
            return []
        } else {
            return sortBy(Object.values(fromRules), 'name')
        }
    }

    public async findRules (query: IncidentClassifierWhereInputType): Promise<IncidentClassifier[]> {
        return filter<IncidentClassifier>(this.rules, query)
    }

    // public findRulesBySelectedClassifiers (type, place, category, problem): IncidentClassifier[] {
    //     const placeIsEmpty = isEmpty(place)
    //     const categoryIsEmpty = isEmpty(category)
    //     const problemIsEmpty = isEmpty(problem)
    //
    //     if (placeIsEmpty && categoryIsEmpty && problemIsEmpty) {
    //         return this.rules
    //     }
    //
    //     switch (type) {
    //         case 'place': {
    //             if (!placeIsEmpty && categoryIsEmpty && problemIsEmpty) {
    //                 return this.rules
    //             }
    //             break
    //         }
    //
    //         case 'category': {
    //             if (placeIsEmpty && !categoryIsEmpty && problemIsEmpty) {
    //                 return this.rules
    //             }
    //             break
    //         }
    //
    //         case 'problem': {
    //             if (placeIsEmpty && categoryIsEmpty && !problemIsEmpty) {
    //                 return this.rules
    //             }
    //
    //             if (!categoryIsEmpty) {
    //                 return this.rules.filter(rule => category.includes(rule.category.id))
    //             }
    //             break
    //         }
    //     }
    //
    //     return this.rules.filter(rule => {
    //         if (!placeIsEmpty && place.includes(rule.place.id)) {
    //             return true
    //         }
    //
    //         if (!categoryIsEmpty && category.includes(rule.category.id)) {
    //             return true
    //         }
    //
    //         if (!problemIsEmpty && rule.problem && problem.includes(rule.problem.id)) {
    //             return true
    //         }
    //
    //         return false
    //     })
    // }

    public async search (input: string, type: string, variables?: QueryAllIncidentClassifiersArgs, limit?: number): Promise<Option[]> {
        const maxSearchCount = limit ? limit : MAX_SEARCH_COUNT

        if (isEmpty(input)) {
            return this[type].slice(0, maxSearchCount)
        } else {
            const search = input.toLocaleLowerCase()
            const result = []
            for (const classifier of this[type]) {
                if (classifier.name.toLowerCase().indexOf(search) !== -1) {
                    result.push(classifier)
                }
                if (result.length > maxSearchCount) {
                    break
                }
            }

            return result
        }
    }

    public clear (): void {
        this.rules = []
        this.problem = []
        this.category = []
    }
}
