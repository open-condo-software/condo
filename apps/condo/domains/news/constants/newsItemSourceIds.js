/**
 * Fixed ids of seeded NewsItemSource rows, so code can look up a specific source without a query.
 * By analogy with TICKET_SOURCE_IDS_BY_TYPE (@condo/domains/ticket/constants/sources.js).
 */
const NEWS_ITEM_SOURCE_IDS = {
    WEB_APP: 'e555cb9b-6f1c-4af5-833f-0affb364096d',
    DEBT: 'efe5f0cb-0f2d-4828-a7cf-056ca58bfa57',
}

module.exports = {
    NEWS_ITEM_SOURCE_IDS,
}
