import { ITicketClassifierRuleUIState, ITicketClassifierRuleWhereInput } from './TicketClassifierRule'
import {
    TicketClassifierRule as TicketClassifierRuleGQL,
    TicketPlaceClassifier as TicketPlaceClassifierGQL,
    TicketCategoryClassifier as TicketCategoryClassifierGQL,
    TicketProblemClassifier as TicketProblemClassifierGQL,
} from '@condo/domains/ticket/gql'
import { ApolloClientType } from '@core/next/apollo'
import { sortBy, isEmpty, filter } from 'lodash'

const MAX_SEARCH_COUNT = 20

type Options = {
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
    rulesToOptions: (rules: ITicketClassifierRuleUIState[], type: string) => Options[]
    findRules: (query: ITicketClassifierRuleWhereInput) => Promise<ITicketClassifierRuleUIState[]>
    search: (input: string, type: string) => Promise<Options[]>
}

interface ILoadClassifierRulesVariables {
    where?: ITicketClassifierRuleWhereInput
    skip?: number
    first?: number
    sortBy?: string
}

async function loadClassifierRules (client: ApolloClientType, variables: ILoadClassifierRulesVariables): Promise<ITicketClassifierRuleUIState[]> {
    const data = await client.query({
        query: TicketClassifierRuleGQL.GET_ALL_OBJS_QUERY,
        variables,
    })
    return data.data.objs
}

// We load all rules to client and do not make any requests later when select changes
export class ClassifiersQueryLocal implements IClassifiersSearch {

    constructor (private client: ApolloClientType, private rules = [], private place = [], private category = [], private problem = []) {}

    public async init (): Promise<void> {
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

    public rulesToOptions (data: ITicketClassifierRuleUIState[], field: string): Options[] {
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

    public async findRules (query: ITicketClassifierRuleWhereInput): Promise<ITicketClassifierRuleUIState[]> {
        const filtered = filter<ITicketClassifierRuleUIState>(this.rules, query)
        return filtered
    }

    public async search (input: string, type: string): Promise<Options[]> {
        if (isEmpty(input)) {
            return this[type].slice(0, MAX_SEARCH_COUNT)
        } else {
            const search = input.toLocaleLowerCase()
            const result = []
            for (const classifier of this[type]) {
                if (classifier.name.toLowerCase().indexOf(search) !== -1) {
                    result.push(classifier)
                }
                if (result.length > MAX_SEARCH_COUNT) {
                    break
                }
            }
            //const result = this[type].filter(place => place.name.toLowerCase().indexOf(search) !== -1)
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

async function searchClassifiers (client: ApolloClientType, query, input: string) {
    const data = await client.query({
        query,
        variables: {
            where: {
                name_contains_i: input,
            },
            first: MAX_SEARCH_COUNT,
            sortBy: 'name_ASC',
        },
    })
    return data.data.objs
}
async function searchPlaceClassifiers (client: ApolloClientType, input: string): Promise<Options[]> {
    const result = await searchClassifiers(client, TicketPlaceClassifierGQL.GET_ALL_OBJS_QUERY, input)
    return result
}
async function searchCategoryClassifiers (client: ApolloClientType, input: string): Promise<Options[]> {
    const result = await searchClassifiers(client, TicketCategoryClassifierGQL.GET_ALL_OBJS_QUERY, input)
    return result
}

async function searchProblemClassifiers (client: ApolloClientType, input: string): Promise<Options[]> {
    const result = await searchClassifiers(client, TicketProblemClassifierGQL.GET_ALL_OBJS_QUERY, input)
    return result
}

const searchClassifiersByType = {
    place: searchPlaceClassifiers,
    category: searchCategoryClassifiers,
    problem: searchProblemClassifiers,
}


export class ClassifiersQueryRemote implements IClassifiersSearch {

    constructor (private client: ApolloClientType, private rules = [], private place = [], private category = [], private problem = []) {}

    public async init (): Promise<void> {
        return
    }

    public rulesToOptions (data: ITicketClassifierRuleUIState[], field: string): Options[] {
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

    public async findRules (query: ITicketClassifierRuleWhereInput): Promise<ITicketClassifierRuleUIState[]> {
        const filtered = await loadClassifierRules(this.client, {
            where: query,
            first: 100,
        })
        return filtered
    }

    public async search (input: string, type: string): Promise<Options[]> {
        const result = await searchClassifiersByType[type](this.client, input)
        return result
    }

    public clear (): void {
        return
    }
}
