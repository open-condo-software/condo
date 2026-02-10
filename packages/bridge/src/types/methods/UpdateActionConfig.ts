import type { SetActionsConfigParams } from './SetActionsConfig'

type ActionPatch = Omit<Partial<SetActionsConfigParams['actions'][number]>, 'id'>

export type UpdateActionConfigParams = {
    id: string
    params: ActionPatch
}

export type UpdateActionConfigData = {
    success: boolean
}