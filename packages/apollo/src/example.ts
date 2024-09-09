import { ListHelper } from './utils/lists'

import type { InitCacheConfig } from './utils/cache'

const headersMW

const config: InitCacheConfig = (options) => {
    const listHelper = new ListHelper({ cacheOptions: options })

    return {
        typePolicies: {
            allContacts: {
                merge: listHelper.mergeLists,
                read: listHelper.getReadFunction('paginate'),
            },
        },
    }
}





