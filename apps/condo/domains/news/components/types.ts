import { NewsItemScope } from '@app/condo/schema'

export type TNewsItemScopeNoInstance = Pick<NewsItemScope, 'property' | 'unitType' | 'unitName'>

export type TUnit = { unitType: string, unitName: string }
