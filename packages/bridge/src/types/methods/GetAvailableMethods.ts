import type { AnyRequestMethodName } from '../bridge'

export type GetAvailableMethodsParams = Record<string, never>

export type GetAvailableMethodsData = {
    methods: Array<AnyRequestMethodName>
}