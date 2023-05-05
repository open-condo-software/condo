import { createCondoBridge } from './bridge'

const bridge = createCondoBridge()

export * from './types/methods'
export * from './types/bridge'
export * from './types/errors'

export { bridge as default }
