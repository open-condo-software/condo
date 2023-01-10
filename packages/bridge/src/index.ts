import { createCondoBridge } from './bridge'

const bridge = createCondoBridge()

export * from './types/methods'
export * from './types/bridge'

export { bridge as default }
