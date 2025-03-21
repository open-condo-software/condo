/**
 * Generated by `createschema news.NewsItemTemplate 'organization?:Relationship:Organization:CASCADE; title:Text; body:Text;'`
 */

const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const { normalizeText } = require('@condo/domains/common/utils/text')
const access = require('@condo/domains/news/access/NewsItemTemplate')
const { ALL_NEWS_CATEGORIES } = require('@condo/domains/news/constants/newsCategory')
const { NEWS_TYPES } = require('@condo/domains/news/constants/newsTypes')


const NewsItemTemplate = new GQLListSchema('NewsItemTemplate', {
    schemaDoc: 'The news item template for quick composing a news item',
    fields: {

        type: {
            schemaDoc: 'The news item template type.',
            type: 'Select',
            options: NEWS_TYPES,
            isRequired: true,
        },

        organization: {
            schemaDoc: 'Organization who creates the template. A common template if there is no organization',
            type: 'Relationship',
            ref: 'Organization',
            kmigratorOptions: { null: true, on_delete: 'models.CASCADE' },
        },

        name: {
            schemaDoc: 'Name of template the news item. Example `Heating outage due to repairs` or any other text value',
            type: 'Text',
            isRequired: true,
        },

        category: {
            schemaDoc: 'Category of template of the news item. Example `Water` or any other select value. News item does not necessarily have a category',
            type: 'Select',
            options: ALL_NEWS_CATEGORIES,
            isRequired: false,
        },

        title: {
            schemaDoc: 'The title of a future news item',
            type: 'Text',
            isRequired: true,
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return normalizeText(resolvedData['title'])
                },
            },
        },

        body: {
            schemaDoc: 'A future news item\'s body',
            type: 'Text',
            isRequired: true,
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return normalizeText(resolvedData['body'])
                },
            },
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical()],
    access: {
        read: access.canReadNewsItemTemplates,
        create: access.canManageNewsItemTemplates,
        update: access.canManageNewsItemTemplates,
        delete: false,
        auth: true,
    },
})

module.exports = {
    NewsItemTemplate,
}
