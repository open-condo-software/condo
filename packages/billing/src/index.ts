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
export type { TDistributionItem, TSplit, TSplitOptions, TRecipient } from './utils/paymentSplitter'
