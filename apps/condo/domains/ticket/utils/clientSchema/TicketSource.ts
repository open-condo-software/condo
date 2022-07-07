import { pick, get } from 'lodash'

import { TicketSource, TicketSourceCreateInput, TicketSourceUpdateInput, QueryAllTicketSourcesArgs } from '@app/condo/schema'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { generateReactHooks } from '@condo/domains/common/utils/codegeneration/generate.hooks'
import { generateNewReactHooks } from '@condo/domains/common/utils/codegeneration/new.generate.hooks'
import { TicketSource as TicketSourceGQL } from '@condo/domains/ticket/gql'

const FIELDS = ['id', 'organization', 'type', 'name']
const RELATIONS = []

export interface ITicketSourceUIState extends TicketSource {
    id: string
}

function convertToUIState (item: TicketSource): ITicketSourceUIState {
    if (item.dv !== 1) throw new Error('unsupported item.dv')

    return pick(item, FIELDS) as ITicketSourceUIState
}

export interface ITicketSourceFormState {
    id?: undefined
}

function convertToUIFormState (state: ITicketSourceUIState): ITicketSourceFormState | undefined {
    if (!state) return

    const result = {}

    for (const attr of Object.keys(state)) {
        const attrId = get(state[attr], 'id')
        result[attr] = (RELATIONS.includes(attr) && state[attr]) ? attrId || state[attr] : state[attr]
    }

    return result as ITicketSourceFormState
}

function convertToGQLInput (state: ITicketSourceFormState): TicketSourceUpdateInput {
    const sender = getClientSideSenderInfo()
    const result = { dv: 1, sender }

    for (const attr of Object.keys(state)) {
        const attrId = get(state[attr], 'id')
        result[attr] = (RELATIONS.includes(attr) && state[attr]) ? { connect: { id: (attrId || state[attr]) } } : state[attr]
    }

    return result
}

export interface ITicketSourceFormSelectState {
    value: string
    label: string
    type: string
}

function convertGQLItemToFormSelectState (item: ITicketSourceUIState): ITicketSourceFormSelectState | undefined {
    if (!item) return

    const { name, id, type } = item

    return { value: id, label: name, type }
}

const {
    useObject,
    useObjects,
    useCreate,
    useUpdate,
    useDelete,
} = generateReactHooks<TicketSource, TicketSourceUpdateInput, ITicketSourceFormState, ITicketSourceUIState, QueryAllTicketSourcesArgs>(TicketSourceGQL, { convertToGQLInput, convertToUIState })
const {
    useNewObject,
    useNewObjects,
    useNewCreate,
    useNewUpdate,
    useNewSoftDelete,
} = generateNewReactHooks<TicketSource, TicketSourceCreateInput, TicketSourceUpdateInput, QueryAllTicketSourcesArgs>(TicketSourceGQL)

export {
    useObject,
    useObjects,
    useCreate,
    useUpdate,
    useDelete,
    convertGQLItemToFormSelectState,
    convertToUIFormState,
    useNewObject,
    useNewObjects,
    useNewCreate,
    useNewUpdate,
    useNewSoftDelete,
}
