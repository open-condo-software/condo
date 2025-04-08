export {
    split,
    areAllRecipientsUnique,
    createRecipientKey,
    getVorItems,
    hasFeePayers,
    hasOverpaymentReceivers,
    hasSingleVorItem,
    sortByVorAndOrderComparator,
} from './utils/paymentSplitter'
export type { DistributionItem, Split, SplitOptions, Recipient } from './utils/paymentSplitter'
