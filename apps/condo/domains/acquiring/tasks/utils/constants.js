const recurrentPaymentConf = process.env['RECURRENT_PAYMENT'] && JSON.parse(process.env['RECURRENT_PAYMENT']) || {
    pageSize: 10,
}

const {
    pageSize,
} = recurrentPaymentConf

const paginationConfiguration = { pageSize }
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'recurrent-payment-context-processing' } }

module.exports = {
    dvAndSender,
    paginationConfiguration,
}