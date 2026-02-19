const AllIcons = require('@open-condo/icons')
const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { find } = require('@open-condo/keystone/schema')

const { DEFAULT_MENU_CATEGORY, ALL_MENU_CATEGORIES } = require('@condo/domains/common/constants/menuCategories')
const { CONTEXT_STATUSES, CONTEXT_IN_PROGRESS_STATUS, B2B_APPS_LABELS } = require('@condo/domains/miniapp/constants')

const APPS_FILE_ADAPTER = new FileAdapter('apps')

const DEVELOPER_FIELD = {
    schemaDoc: 'Developer company name',
    type: 'Text',
    isRequired: true,
}

const LOGO_FIELD = {
    schemaDoc: 'Logo of app\'s company or app itself',
    type: 'File',
    isRequired: false,
    adapter: APPS_FILE_ADAPTER,
}

const ICON_FIELD = {
    schemaDoc: 'App icon. The presence of this field means that this app will be pinned to the CRM menu after the connection.',
    isRequired: false,
    type: 'Select',
    dataType: 'string',
    options: Object.keys(AllIcons),
}

const MENU_CATEGORY_FIELD = {
    schemaDoc: 'This field is responsible for which category of the CRM menu the application ' +
        'icon will fall into when connected. ' +
        `If not specified - then connected with the icon will be displayed in category "${DEFAULT_MENU_CATEGORY}" by default.`,
    isRequired: false,
    type: 'Select',
    dataType: 'string',
    options: ALL_MENU_CATEGORIES,
}

const DEVELOPER_URL_FIELD = {
    schemaDoc: 'Link to the website of the developer company, where the user can find out detailed information about the partner',
    type: 'Text',
    isRequired: false,
}

const APP_IMAGE_FIELD = {
    schemaDoc: 'Image',
    type: 'File',
    isRequired: true,
    adapter: APPS_FILE_ADAPTER,
}

const SHORT_DESCRIPTION_FIELD = {
    schemaDoc: 'Short description / catch phrase providing information about integration functionality. Will be shown on App\'s card',
    type: 'Text',
    isRequired: true,
}

const APP_DETAILS_FIELD = {
    schemaDoc: 'Text describing app functionality, connection process and pricing in full detail. Written in markdown without html tags. Will be shown on app\'s page',
    type: 'Markdown',
    isRequired: true,
}

const IFRAME_URL_FIELD = {
    schemaDoc: 'Url to app page, which is the app starting point and will be opened in iframe',
    type: 'Url',
    isRequired: false,
}

const IS_HIDDEN_FIELD = {
    schemaDoc: 'Indicates whether the integration or app is hidden inside the CRM. Used if integration is active by default or not ready to appear inside CRM',
    type: 'Checkbox',
    defaultValue: false,
    isRequired: true,
}

const CONTEXT_DEFAULT_STATUS_FIELD = {
    schemaDoc: 'Status, which context will have by default after creation if no overwriting option provided',
    isRequired: true,
    type: 'Select',
    dataType: 'string',
    options: CONTEXT_STATUSES,
    defaultValue: CONTEXT_IN_PROGRESS_STATUS,
}

const DISPLAY_PRIORITY_FIELD = {
    schemaDoc: 'The number used to determine the position of the app among the others. ' +
        'App with higher priority appear earlier in "All" category, as well as in it\'s own category. ' +
        'Apps with the same priority are sorted from newest to oldest. The default value is 1.',
    type: 'Integer',
    isRequired: true,
    defaultValue: 1,
}

const LABEL_FIELD = {
    schemaDoc: 'App can be marked with one of the following labels in order to visually ' +
        `stand out from other applications: [${B2B_APPS_LABELS.join(', ')}]`,
    type: 'Select',
    isRequired: false,
    dataType: 'string',
    options: B2B_APPS_LABELS,
}

const PRICE_FIELD = {
    schemaDoc: 'String representing a base price of app. Usually it\'s something like "Free", "Individual", "$50 / year"',
    type: 'Text',
    isRequired: false,
}

function createSubscriptionPlansField (appFieldName) {
    return {
        schemaDoc: 'Virtual field that returns all active SubscriptionPlans that include this miniapp. ' +
            `Returns array of SubscriptionPlan objects where this app is in ${appFieldName}. ` +
            'Empty array means the app is available to all organizations without subscription.',
        type: 'Virtual',
        graphQLReturnType: '[SubscriptionPlan]',
        graphQLReturnFragment: '{ id name }',
        resolver: async (item) => {
            const plans = await find('SubscriptionPlan', {
                deletedAt: null,
                isHidden: false,
            })

            return plans.filter(plan => 
                plan[appFieldName] && Array.isArray(plan[appFieldName]) && plan[appFieldName].includes(item.id)
            )
        },
    }
}

const SUBSCRIPTION_PLANS_FIELD_B2B = createSubscriptionPlansField('enabledB2BApps')
const SUBSCRIPTION_PLANS_FIELD_B2C = createSubscriptionPlansField('enabledB2CApps')

module.exports = {
    DEVELOPER_FIELD,
    LOGO_FIELD,
    DEVELOPER_URL_FIELD,
    APP_IMAGE_FIELD,
    SHORT_DESCRIPTION_FIELD,
    APP_DETAILS_FIELD,
    IFRAME_URL_FIELD,
    APPS_FILE_ADAPTER,
    IS_HIDDEN_FIELD,
    CONTEXT_DEFAULT_STATUS_FIELD,
    DISPLAY_PRIORITY_FIELD,
    LABEL_FIELD,
    PRICE_FIELD,
    ICON_FIELD,
    MENU_CATEGORY_FIELD,
    SUBSCRIPTION_PLANS_FIELD_B2B,
    SUBSCRIPTION_PLANS_FIELD_B2C,
}

