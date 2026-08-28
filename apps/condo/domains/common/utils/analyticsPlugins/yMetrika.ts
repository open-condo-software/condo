import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import ym from 'react-yandex-metrika'

import type { AnalyticsPlugin } from '@open-condo/miniapp-utils'

// Only bridges visitor ids with other providers; counter setup and hit tracking live in <YandexMetrika/>
export const yMetrikaAnalyticsPlugin: AnalyticsPlugin = {
    name: 'yMetrika',
    identify: ({ payload, instance }) => {
        // Same fields/values Metrika's userParams used to get from the old,
        // Metrika-specific effect in <YandexMetrika/>, kept for existing Metrika segments/reports
        const overridedParams = omitBy({
            UserID: payload.userId,
            organizationId: payload.traits['organization.id'],
            roleName: payload.traits.roleName,
            roleNameNonLocalized: payload.traits.role,
        }, isNil)

        const visitorIds = Object.fromEntries(
            Object.keys(instance.plugins)
                .filter((name) => name in payload.traits)
                .map((name) => [name, payload.traits[name]])
        )

        ym('userParams', { ...visitorIds, ...overridedParams })
    },
    methods: {
        getVisitorId: () => new Promise<string | undefined>((resolve) => {
            ym('getClientID', resolve)
        }),
    },
}
