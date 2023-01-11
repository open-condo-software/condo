import type { CondoBridge } from './types/bridge'
import bridge from './index'

declare global {
    interface Window { condoBridge: CondoBridge }
}

window.condoBridge = bridge