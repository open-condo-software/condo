import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import { z } from 'zod'

import bridge, { type GetLaunchParamsData, type GetLaunchParamsParams } from '@open-condo/bridge'
import type { CloseApplicationData, CloseApplicationParams, RequestAuthData, RequestAuthParams } from '@open-condo/bridge'
import { usePostMessageContext, zodSchemaToValidator } from '@open-condo/miniapp-utils/helpers/messaging'
import { getClientSideFingerprint } from '@open-condo/miniapp-utils/helpers/sender'
import { replaceDomain } from '@open-condo/miniapp-utils/helpers/urls'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { IFrame } from '@condo/domains/common/components/IFrame'

import type { IFrameProps } from '@condo/domains/common/components/IFrame'

type B2BAppFrameProps = Pick<IFrameProps, 'src' | 'metadata' | 'initialHeight'>

export const B2BAppFrame: React.FC<B2BAppFrameProps>  = ({ src, metadata, initialHeight }) => {
    const intl = useIntl()
    const { addHandler, addMiddleware } = usePostMessageContext()
    const router = useRouter()
    const { user } = useAuth()
    const { organization } = useOrganization()

    const mappedSrc = useMemo(() => {
        let result = src
        const mapping = metadata?.domainsMapping ?? []
        
        for (const { from, to } of mapping) {
            result = replaceDomain(result, from, to, { encoded: true })
        }
        
        return result
    }, [metadata?.domainsMapping, src])

    const onB2BAppFrameRegister: NonNullable<IFrameProps['onRegister']> = useCallback((event) => {
        const { frameId, frameRef, frameOrigin } = event

        if (user?.id && user?.type &&  organization?.id) {
            addHandler<GetLaunchParamsParams, GetLaunchParamsData>(
                'condo-bridge',
                'CondoWebAppGetLaunchParams',
                frameId,
                zodSchemaToValidator(z.strictObject({})),
                () => ({
                    condoUserId: user.id,
                    condoUserType: (user.type ?? 'staff') as GetLaunchParamsData['condoUserType'],
                    condoContextEntity: 'Organization',
                    condoContextEntityId: organization.id,
                    condoLocale: intl.locale,
                    condoDeviceId: getClientSideFingerprint(),
                })
            )
        }

        addMiddleware<RequestAuthParams, RequestAuthData>({
            scope: frameId,
            eventType: 'condo-bridge',
            eventName: 'CondoWebAppRequestAuth',
            fn: ({ next, params }) => {
                let url = params.url

                for (const { from, to } of (metadata?.domainsMapping ?? [])) {
                    url = replaceDomain(url, from, to, { encoded: true })
                }

                return next({ params: { ...params, url } })
            },
        })

        addHandler<CloseApplicationParams, CloseApplicationData>(
            'condo-bridge',
            'CondoWebAppCloseApplication',
            frameId,
            zodSchemaToValidator(z.strictObject({})),
            async () => {
                const srcUrl = new URL(src)
                const modalId = srcUrl.searchParams.get('modalId')
                // NOTE 1: Case 1. B2BApp frame is opened via modal (CondoWebAppShowModalWindow call),
                // In that case we should treat CloseApplication call as alias to CondoWebAppCloseModalWindow with it's modalId
                if (modalId) {
                    const { success } = await bridge
                        .send('CondoWebAppCloseModalWindow', { modalId })
                        .then(({ success }) => ({ success }))
                        .catch(() => ({ success: false }))

                    if (success) {
                        return { success }
                    }
                }

                // Default case, just redirect to home page
                void router.push('/')

                return {
                    success: true,
                }
            }
        )
    }, [addHandler, addMiddleware, intl.locale, metadata?.domainsMapping, organization?.id, router, src, user?.id, user?.type])


    return (
        <>
            <IFrame
                onRegister={onB2BAppFrameRegister}
                src={mappedSrc}
                metadata={metadata}
                initialHeight={initialHeight}
            />
        </>
    )
}