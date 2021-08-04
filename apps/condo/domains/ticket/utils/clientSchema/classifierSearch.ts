import { ITicketClassifierRuleUIState, ITicketClassifierRuleWhereInput } from './TicketClassifierRule'
import { TicketClassifierRule as TicketClassifierRuleGQL } from '@condo/domains/ticket/gql'
import { ApolloClient } from '@core/next/apollo'
import { sortBy, isEmpty, filter } from 'lodash'

type Options = {
    id: string
    name: string
}

export enum TicketClassifierTypes {
    place = 'place',
    category = 'category',
    description = 'description',
}
export interface IClassifiersSearch {
    init: () => Promise<void>
    rulesToOptions: (rules: ITicketClassifierRuleUIState[], type: string) => Options[]
    findRules: (query: ITicketClassifierRuleWhereInput) => Promise<ITicketClassifierRuleUIState[]>
    search: (input: string, type: string) => Promise<Options[]>
}

interface ILoadClassifierRulesVariables {
    where?: ITicketClassifierRuleWhereInput
    skip: number
    first: number
    sortBy?: string
}

async function loadClassifierRules (client: ApolloClient, variables: ILoadClassifierRulesVariables): Promise<ITicketClassifierRuleUIState[]> {
    const data = await client.query({
        query: TicketClassifierRuleGQL.GET_ALL_OBJS_QUERY,
        variables,
    })
    return data.data.objs
}


export class ClassifiersQueryLocal implements IClassifiersSearch {

    constructor (private client: ApolloClient, private rules = [], private place = [], private category = [], private description = []) {}

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
        this.description = this.rulesToOptions(allRules, 'description')
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
            return this[type].slice(0, 20)
        } else {
            const search = input.toLocaleLowerCase()
            const founded = this[type].filter(place => place.name.toLowerCase().indexOf(search) !== -1)
            return founded
        }
    }

    public clear (): void {
        this.rules = []
        this.description = []
        this.category = []
        this.place = []
    }
}
