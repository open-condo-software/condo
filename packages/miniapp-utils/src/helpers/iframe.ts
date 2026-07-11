import { z } from 'zod'

import { nonNull } from './collections'
import { isDebug } from './environment'
import { getUrlMeta } from './urls'


const mappingRule = z.object({
    from: z.string(),
    to: z.string(),
})

const domainsMapping = z.array(mappingRule)

export const IFRAME_PERMISSIONS_SCHEMA = z.object({
    isFullscreenAllowed: z.boolean().nullish().transform(v => v ?? false),
    isMicrophoneAllowed: z.boolean().nullish().transform(v => v ?? false),
    isCameraAllowed: z.boolean().nullish().transform(v => v ?? false),
    isSpeakerSelectionAllowed: z.boolean().nullish().transform(v => v ?? false),
    isClipboardWriteAllowed: z.boolean().nullish().transform(v => v ?? false),
}).default({
    isFullscreenAllowed: false,
    isMicrophoneAllowed: false,
    isCameraAllowed: false,
    isSpeakerSelectionAllowed: false,
    isClipboardWriteAllowed: false,
})
export const IFRAME_METADATA_SCHEMA = z.object({
    domainsMapping,
    permissions: IFRAME_PERMISSIONS_SCHEMA,
})

export function buildAllowString (permissions: Partial<IFramePermissions>): string {
    return [
        permissions.isFullscreenAllowed ? 'fullscreen' : null,
        permissions.isMicrophoneAllowed ? 'microphone' : null,
        permissions.isCameraAllowed ? 'camera' : null,
        permissions.isSpeakerSelectionAllowed ? 'speaker-selection' : null,
        permissions.isClipboardWriteAllowed ? 'clipboard-write' : null,
    ].filter(nonNull).join('; ')
}

export type DomainsMapping = z.infer<typeof domainsMapping>
export type IFramePermissions = z.infer<typeof IFRAME_PERMISSIONS_SCHEMA>
export type IFrameMetadata = z.infer<typeof IFRAME_METADATA_SCHEMA>

type GetAppEntrypointParams = {
    appUrl: string
    domainsMapping: Array<{
        from: string
        to: string
    }>
}

export function getAppEntrypoint ({ appUrl, domainsMapping }: GetAppEntrypointParams): string {
    let isLocalhost = false
    if (typeof window !== 'undefined') {
        const hostAppMeta = getUrlMeta(window.location.href)
        isLocalhost = hostAppMeta?.isLocalhost ?? false
    }

    // At local development (e.g. http://localhost:3000), you want raw urls, since your app is probably local too
    if (isDebug() || isLocalhost) return appUrl

    const originalUrl = new URL(appUrl)
    const fromDomain = originalUrl.origin

    const mappingRule = domainsMapping.find(rule => rule.from === fromDomain)
    if (!mappingRule) return appUrl

    const toUrl = new URL(mappingRule.to)
    toUrl.pathname = originalUrl.pathname
    toUrl.search = originalUrl.search
    toUrl.hash = originalUrl.hash

    return toUrl.toString()
}

type MiniappType = {
    id: string
    name?: string | null
    appUrl?: string | null
    domains?: { mapping: Array<{ from: string, to: string }> } | null
    isFullscreenAllowed?: boolean | null
    isMicrophoneAllowed?: boolean | null
    isCameraAllowed?: boolean | null
    isSpeakerSelectionAllowed?: boolean | null
}

export type MiniappMetaData = {
    id: string
    name: string | null
    entrypoint: string
    domainsMapping: DomainsMapping
    permissions: IFramePermissions
}

export function extractMiniappMetadata (app: MiniappType): MiniappMetaData | null {
    if (!app || !app.appUrl) return null

    const domainsMapping = app.domains?.mapping ?? []
    const permissions: IFramePermissions = IFRAME_PERMISSIONS_SCHEMA.parse({
        isFullscreenAllowed: app.isFullscreenAllowed,
        isMicrophoneAllowed: app.isMicrophoneAllowed,
        isCameraAllowed: app.isCameraAllowed,
        isSpeakerSelectionAllowed: app.isSpeakerSelectionAllowed,
    })

    return {
        id: app.id,
        name: app.name ?? null,
        entrypoint: getAppEntrypoint({
            appUrl: app.appUrl,
            domainsMapping,
        }),
        domainsMapping,
        permissions,
    }
}