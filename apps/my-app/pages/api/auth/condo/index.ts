import { condoOIDCMiddleware } from '@/domains/user/utils/auth'

const handler = condoOIDCMiddleware.getAuthHandler()

export default handler
