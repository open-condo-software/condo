import bridge from './index'

import type { CondoBridge } from './types/bridge'

declare global {
    interface Window { condoBridge: CondoBridge }
}

window.condoBridge = bridge