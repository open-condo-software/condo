import { QueryAllTicketCategoryClassifiersArgs, TicketClassifier } from '@app/condo/schema'
import { filter, isEmpty, sortBy } from 'lodash'

import { ApolloClient } from '@open-condo/next/apollo'

import {
    TicketCategoryClassifier as TicketCategoryClassifierGQL,
    TicketClassifier as TicketClassifierGQL,
    TicketPlaceClassifier as TicketPlaceClassifierGQL,
    TicketProblemClassifier as TicketProblemClassifierGQL,
} from '@condo/domains/ticket/gql'

import { ITicketClassifierWhereInput } from './TicketClassifier'


const MAX_SEARCH_COUNT = 20

export type Options = {
    id: string
    name: string
}

export enum TicketClassifierTypes {
    place = 'place',
    category = 'category',
    problem =  'problem',
}
export interface IClassifiersSearch {
    init: () => Promise<void>
    rulesToOptions: (rules: TicketClassifier[], type: string) => Options[]
    findRules: (query: ITicketClassifierWhereInput) => Promise<TicketClassifier[]>
    search: (input: string, type: string, variables: QueryAllTicketCategoryClassifiersArgs) => Promise<Options[]>
}

interface ILoadClassifierRulesVariables {
    where?: ITicketClassifierWhereInput
    skip?: number
    first?: number
    sortBy?: string
}

async function loadClassifierRules (client: ApolloClient, variables: ILoadClassifierRulesVariables): Promise<TicketClassifier[]> {
    const data = await client.query({
        query: TicketClassifierGQL.GET_ALL_OBJS_QUERY,
        variables,
    })
    return data.data.objs
}

// We load all rules to client and do not make any requests later when select changes
export class ClassifiersQueryLocal implements IClassifiersSearch {

    constructor (private client: ApolloClient, private rules = [], private place = [], private category = [], private problem = []) {}

    public async init (): Promise<void> {
        if (this.rules && this.rules.length) {
            return
        }
        let skip = 0
        let maxCount = 500
        let newchunk = []
        let allRules = []
        do {
            newchunk = await loadClassifierRules(this.client, { first: 200, skip: skip, sortBy: 'id_ASC' })
            allRules = allRules.concat(newchunk)
            skip += newchunk.length
        } while (--maxCount > 0 && newchunk.length)
        this.rules = allRules
        this.place = this.rulesToOptions(allRules, 'place')
        this.category = this.rulesToOptions(allRules, 'category')
        this.problem = this.rulesToOptions(allRules, 'problem')
    }

    public rulesToOptions (data: TicketClassifier[], field: string): Options[] {
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

    public async findRules (query: ITicketClassifierWhereInput): Promise<TicketClassifier[]> {
        return filter<TicketClassifier>(this.rules, query)
    }

    public findRulesBySelectedClassifiers (type, place, category, problem): TicketClassifier[] {
        const placeIsEmpty = isEmpty(place)
        const categoryIsEmpty = isEmpty(category)
        const problemIsEmpty = isEmpty(problem)

        if (placeIsEmpty && categoryIsEmpty && problemIsEmpty) {
            return this.rules
        }

        switch (type) {
            case 'place': {
                if (!placeIsEmpty && categoryIsEmpty && problemIsEmpty) {
                    return this.rules
                }
                break
            }

            case 'category': {
                if (placeIsEmpty && !categoryIsEmpty && problemIsEmpty) {
                    return this.rules
                }
                break
            }

            case 'problem': {
                if (placeIsEmpty && categoryIsEmpty && !problemIsEmpty) {
                    return this.rules
                }

                if (!categoryIsEmpty) {
                    return this.rules.filter(rule => category.includes(rule.category.id))
                }
                break
            }
        }

        return this.rules.filter(rule => {
            if (!placeIsEmpty && place.includes(rule.place.id)) {
                return true
            }

            if (!categoryIsEmpty && category.includes(rule.category.id)) {
                return true
            }

            if (!problemIsEmpty && rule.problem && problem.includes(rule.problem.id)) {
                return true
            }

            return false
        })
    }

    public async search (input: string, type: string, variables?: QueryAllTicketCategoryClassifiersArgs, limit?: number): Promise<Options[]> {
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
        this.place = []
    }
}

// We do not load all rules to client but load them on request (looks a little bit slow)

async function searchClassifiers (client: ApolloClient, query, input: string, variables: any) {
    const data = await client.query({
        query,
        variables: {
            where: {
                name_contains_i: input,
            },
            first: MAX_SEARCH_COUNT,
            sortBy: 'name_ASC',
            ...variables,
        },
    })
    return data.data.objs
}
async function searchPlaceClassifiers (client: ApolloClient, input: string, variables: QueryAllTicketCategoryClassifiersArgs): Promise<Options[]> {
    return await searchClassifiers(client, TicketPlaceClassifierGQL.GET_ALL_OBJS_QUERY, input, variables)
}
async function searchCategoryClassifiers (client: ApolloClient, input: string, variables: QueryAllTicketCategoryClassifiersArgs): Promise<Options[]> {
    return await searchClassifiers(client, TicketCategoryClassifierGQL.GET_ALL_OBJS_QUERY, input, variables)
}

async function searchProblemClassifiers (client: ApolloClient, input: string, variables: QueryAllTicketCategoryClassifiersArgs): Promise<Options[]> {
    return await searchClassifiers(client, TicketProblemClassifierGQL.GET_ALL_OBJS_QUERY, input, variables)
}

const searchClassifiersByType = {
    place: searchPlaceClassifiers,
    category: searchCategoryClassifiers,
    problem: searchProblemClassifiers,
}


export class ClassifiersQueryRemote implements IClassifiersSearch {

    constructor (private client: ApolloClient) {}

    public async init (): Promise<void> {
        return
    }

    public rulesToOptions (data: TicketClassifier[], field: string): Options[] {
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

    public async findRules (query: ITicketClassifierWhereInput): Promise<TicketClassifier[]> {
        return await loadClassifierRules(this.client, {
            where: query,
            first: 100,
        })
    }

    public async search (input: string, type: string, variables: QueryAllTicketCategoryClassifiersArgs): Promise<Options[]> {
        return await searchClassifiersByType[type](this.client, input, variables)
    }

    public clear (): void {
        return
    }
}
