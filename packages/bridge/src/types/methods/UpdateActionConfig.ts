import type { SetActionsConfigParams } from './SetActionsConfig'

type ActionPatch = Omit<Partial<SetActionsConfigParams['actions'][number]>, 'key'>

export type UpdateActionConfigParams = {
    id: string
    params: ActionPatch
}

export type UpdateActionConfigData = {
    success: boolean
}