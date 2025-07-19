import { NewsItemScope } from '@app/condo/schema'

export type NewsItemScopeNoInstanceType = Pick<NewsItemScope, 'property' | 'unitType' | 'unitName'>

export type TUnit = { unitType: string, unitName: string }
