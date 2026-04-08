const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('SubscriptionPaymentAdapter')

class SubscriptionPaymentAdapter {

    static async proceedPayment ({ directPaymentUrl, cardTokenId }) {
        try {
            const url = new URL(directPaymentUrl)
            url.searchParams.append('cardTokenId', cardTokenId)

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
            const { isSucceeded, isCanceled, paymentId, cancellationDetails } = data

            if (isSucceeded && paymentId) {
                logger.info({ msg: 'payment succeeded', data: { paymentId, cardTokenId } })
                return { status: 'success', paid: true, paymentId }
            } else if (isCanceled) {
                const cancelReason = cancellationDetails?.reason || 'Unknown error'
                logger.warn({ msg: 'payment canceled', data: { isCanceled, cardTokenId, cancellationDetails, response: data } })
                return {
                    status: 'canceled',
                    paid: false,
                    errorMessage: cancelReason,
                    cancellationDetails,
                }
            } else {
                const errorMessage = data?.error || 'Payment failed'
                logger.warn({ msg: 'payment not successful', data: { isSucceeded, isCanceled, cardTokenId, response: data } })
                return {
                    status: 'failed',
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
