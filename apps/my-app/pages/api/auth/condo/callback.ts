import { condoOIDCMiddleware } from '@/domains/user/utils/auth'

const handler = condoOIDCMiddleware.getCallbackHandler()

export default handler
