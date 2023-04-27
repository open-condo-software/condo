const { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } = require('@condo/domains/news/constants/newsTypes')
const { defineMessageType } = require('@condo/domains/news/tasks/notifyResidentsAboutNewsItem.helpers')
const {
    NEWS_ITEM_COMMON_MESSAGE_TYPE,
    NEWS_ITEM_EMERGENCY_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')

describe('Helpers', () => {
    test('Message type defined correctly', () => {
        const cases = [
            [NEWS_TYPE_COMMON, NEWS_ITEM_COMMON_MESSAGE_TYPE],
            [NEWS_TYPE_EMERGENCY, NEWS_ITEM_EMERGENCY_MESSAGE_TYPE],
            [null, NEWS_ITEM_COMMON_MESSAGE_TYPE],
            [undefined, NEWS_ITEM_COMMON_MESSAGE_TYPE],
            ['wat?', NEWS_ITEM_COMMON_MESSAGE_TYPE],
        ]

        for (const theCase of cases) {
            expect(defineMessageType({ type: theCase[0] })).toEqual(theCase[1])
        }
    })
})
