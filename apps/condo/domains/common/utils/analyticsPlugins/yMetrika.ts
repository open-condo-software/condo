import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import ym from 'react-yandex-metrika'

import type { AnalyticsPlugin } from '@open-condo/miniapp-utils'

/**
 * Bridges Metrika into the generic analytics layer:
 * - exposes its own client_id as a visitor id, so other providers can link to it
 * - receives other providers' visitor ids through the standard "identify" traits,
 *   and forwards them into Metrika's own "userParams"
 *
 * The actual Metrika SDK/counter setup and page-view tracking live in the
 * <YandexMetrika/> component — this plugin only bridges ids between systems.
 */
export const yMetrikaAnalyticsPlugin: AnalyticsPlugin = {
    name: 'yMetrika',
    identify: ({ payload }) => {
        // Same fields/values Metrika's userParams used to get from the old,
        // Metrika-specific effect in <YandexMetrika/>, kept for existing Metrika segments/reports
        const overridedParams = omitBy({
            UserID: payload.userId,
            organizationId: payload.traits['organization.id'],
            roleName: payload.traits.roleName,
            roleNameNonLocalized: payload.traits.role,
        }, isNil)

        ym('userParams', { ...payload.traits, ...overridedParams })
    },
    methods: {
        getVisitorId: () => new Promise<string | undefined>((resolve) => {
            ym('getClientID', resolve)
        }),
    },
}
