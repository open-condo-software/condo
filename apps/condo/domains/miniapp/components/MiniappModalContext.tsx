import { createContext, useContext } from 'react'

import type { ShowModalWindowParams } from '@open-condo/bridge'
import type { IFrameMetadata } from '@open-condo/miniapp-utils/helpers/iframe'

type MiniappModalOpener = (params: ShowModalWindowParams & { metadata?: IFrameMetadata }) => void

const MiniappModalContext = createContext<MiniappModalOpener | null>(null)

export const MiniappModalProvider = MiniappModalContext.Provider

export function useOpenMiniappModal () {
    return useContext(MiniappModalContext)
}
