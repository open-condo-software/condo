const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('SubscriptionPaymentAdapter')

class SubscriptionPaymentAdapter {

    static async proceedPayment ({ directPaymentUrl, cardTokenId }) {
        try {
            const provider = conf['B2B_PAYMENTS_PROVIDER']
            if (!provider) {
                throw new Error('B2B_PAYMENTS_PROVIDER is not configured')
            }

            const returnUrl = `${conf.SERVER_URL}/settings?tab=subscription`
            const url = new URL(directPaymentUrl)
            url.searchParams.append('provider', provider)
            url.searchParams.append('cardTokenId', cardTokenId)
            url.searchParams.append('returnUrl', returnUrl)

            const response = await fetch(url.toString())
            
            if (!response.ok) {
                const errorText = await response.text()
                logger.error({
                    msg: 'payment request failed',
                    data: { directPaymentUrl, cardTokenId, status: response.status, errorText },
                })
                return {
                    paid: false,
                    errorMessage: errorText || `HTTP ${response.status}`,
                }
            }

            const data = await response.json()
            const status = data?.status
            const paymentId = data?.paymentId
            const cancellationDetails = data?.cancellationDetails

            if (status === 'success' && paymentId) {
                logger.info({ msg: 'payment succeeded', data: { paymentId, cardTokenId } })
                return { status: 'success', paid: true, paymentId }
            } else if (status === 'canceled') {
                const cancelReason = cancellationDetails?.reason || 'Unknown error'
                logger.warn({ msg: 'payment canceled', data: { status, cardTokenId, cancellationDetails, response: data } })
                return {
                    status: 'canceled',
                    paid: false,
                    errorMessage: cancelReason,
                    cancellationDetails,
                }
            } else {
                const errorMessage = data?.error || 'Payment failed'
                logger.warn({ msg: 'payment not successful', data: { status, cardTokenId, response: data } })
                return {
                    status,
                    paid: false,
                    errorMessage,
                }
            }
        } catch (error) {
            const errorMessage = error?.message || 'Unknown error'
            logger.error({
                msg: 'payment processing error',
                err: error,
                data: { directPaymentUrl, cardTokenId, errorMessage },
            })
            return {
                paid: false,
                errorMessage,
            }
        }
    }

    static async deleteCardToken ({ hostUrl, organizationId, cardTokenId }) {
        try {
            const deleteUrl = `${hostUrl}/api/clients/${organizationId}/card-tokens/${cardTokenId}`
            const secret = conf['B2B_PAYMENT_GATEWAY_SECRET']

            const options = { method: 'DELETE' }
            if (secret) {
                const credentials = Buffer.from(secret).toString('base64')
                options.headers = {
                    'Authorization': `Basic ${credentials}`,
                }
            }
            
            const response = await fetch(deleteUrl, options)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const errorMessage = errorData?.message || `HTTP ${response.status}`
                logger.error({
                    msg: 'failed to delete card token',
                    data: { cardTokenId, organizationId, statusCode: response.status, errorMessage },
                })
                throw new Error(errorMessage)
            }

            logger.info({ msg: 'card token deleted', data: { cardTokenId, organizationId } })
            return true
        } catch (error) {
            const errorMessage = error?.message || 'Unknown error'
            logger.error({
                msg: 'failed to delete card token',
                err: error,
                data: { cardTokenId, organizationId, errorMessage },
            })
            throw error
        }
    }
}

module.exports = {
    SubscriptionPaymentAdapter,
}
