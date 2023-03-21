const conf = require('@open-condo/config')

const recurrentPaymentConf = conf.RECURRENT_PAYMENT_CONFIG ? JSON.parse(conf.RECURRENT_PAYMENT_CONFIG) : {
    pageSize: 10,
}

const {
    pageSize,
} = recurrentPaymentConf

const paginationConfiguration = { pageSize }

module.exports = {
    paginationConfiguration,
}