const faker = require('faker')

const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { File, Text, Relationship, Select } = require('@keystonejs/fields')

const conf = require('@core/config')
const { GQLListSchema } = require('@core/keystone/schema')
const { Json } = require('@core/keystone/fields')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')

const { SENDER_FIELD, DV_FIELD } = require('../_common')
const { rules } = require('../../access')
const countries = require('@condo/domains/common/constants/countries')

const AVATAR_FILE_ADAPTER = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/orgavatars`,
    path: `${conf.MEDIA_URL}/orgavatars`,
})

const Organization = new GQLListSchema('Organization', {
    schemaDoc: 'B2B customer of the service, a legal entity or an association of legal entities (holding/group)',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        country: {
            schemaDoc: 'Country level specific',
            isRequired: true,
            type: Select,
            options: countries.COUNTRIES,
        },
        name: {
            schemaDoc: 'Customer-friendly name',
            factory: () => faker.company.companyName(),
            type: Text,
            isRequired: true,
            kmigratorOptions: { null: false },
        },
        description: {
            schemaDoc: 'Customer-friendly description. Friendly text for employee and resident users',
            type: Wysiwyg,
            isRequired: false,
        },
        avatar: {
            schemaDoc: 'Customer-friendly avatar',
            type: File,
            isRequired: false,
            adapter: AVATAR_FILE_ADAPTER,
        },
        meta: {
            schemaDoc: 'Organization metadata. Depends on country level specific' +
                'Examples of data keys: `inn`, `kpp`',
            type: Json,
            isRequired: true,
        },
        employees: {
            type: Relationship,
            ref: 'OrganizationEmployee.organization',
            many: true,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: rules.canReadOrganizations,
        create: rules.canManageOrganizations,
        update: rules.canManageOrganizations,
        delete: false,
        auth: true,
    },
})

module.exports = {
    Organization,
}
