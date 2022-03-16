const { setInitialStatusTrigger } = require('./setInitialStatusTrigger')
const { responsibleStatusTrigger } = require('./responsibleStatusTrigger')
const { incrementStatusReopenedCounterTrigger } = require('./incrementStatusReopenedCounterTrigger')
const { closeTicketAfterResidentReviewTrigger } = require('./closeTicketAfterResidentReviewTrigger')

module.exports = {
    setInitialStatusTrigger,
    responsibleStatusTrigger,
    incrementStatusReopenedCounterTrigger,
    closeTicketAfterResidentReviewTrigger,
}