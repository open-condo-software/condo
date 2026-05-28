import { WebCondoBridge } from './web'

import type { CondoBridge } from '../types/bridge'

export function createCondoBridge (): CondoBridge {
    return new WebCondoBridge()
}