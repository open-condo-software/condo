const { v4: uuid } = require('uuid')
const faker = require('faker')
const { Text, Checkbox, Password, CalendarDay, File, Relationship, DateTime, Select } = require('@keystonejs/fields')
const { byTracking, atTracking } = require('@keystonejs/list-plugins')

const { GQLListSchema, GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@core/keystone/access')
const conf = require('@core/config')
const { User } = require('./User')

const Organization = new GQLListSchema('Organization', {
    fields: {
        name: {
            factory: () => faker.company.companyName(),
            type: Text,
        },
        isActive: { type: Checkbox, defaultValue: true },
        userLinks: {
            type: Relationship, ref: 'OrganizationToUserLink.organization', many: true,
        },
    },
    access: {
        // read: access.userIsAdminOrOwner,
        read: access.canReadOnlyActive,
        create: access.userIsAdmin,
        update: access.userIsAdmin,
        delete: access.userIsAdmin,
        auth: true,
    },
    plugins: [byTracking(), atTracking()],
    adminDoc: 'List of Organizations',
    adminConfig: {
        defaultPageSize: 50,
        maximumPageSize: 200,
        defaultSort: 'name',
        defaultColumns: 'name, isActive',
    },
})

const OrganizationToUserLink = new GQLListSchema('OrganizationToUserLink', {
    fields: {
        organization: {
            factory: () => ({ create: Organization._factory() }),
            type: Relationship,
            ref: 'Organization.userLinks',
            isRequired: true,
            knexOptions: { isNotNullable: true },
        },
        user: {
            factory: () => ({ create: User._factory() }),
            type: Relationship,
            ref: 'User',
            isRequired: true,
            knexOptions: { isNotNullable: true },
        },
        role: {
            type: Select,
            options: 'owner, member',
            isRequired: true,
            defaultValue: 'member',
            knexOptions: { isNotNullable: true },
        },
    },
    access: {
        read: accessAllowOnlyForLinkedUsers,
        create: accessAllowOnlyForRoleOwner,
        update: accessAllowOnlyForRoleOwner,
        delete: accessAllowOnlyForRoleOwner,
        auth: true,
    },
    plugins: [byTracking(), atTracking()],
    adminDoc: 'List of relationships between Users and Organizations',
    adminConfig: {
        defaultPageSize: 50,
        maximumPageSize: 200,
        defaultColumns: 'organization, user, role',
    },
})

function accessAllowOnlyForLinkedUsers ({ authentication: { item: user } }) {
    if (!user) return false
    if (user.isAdmin) return {}
    return {
        organization: { userLinks_some: { user: { id: user.id } } },
    }
}

function accessAllowOnlyForRoleOwner ({ authentication: { item: user } }) {
    if (!user) return false
    if (user.isAdmin) return true
    return {
        organization: { userLinks_some: { user: { id: user.id }, role: 'owner' } },
    }
}

module.exports = {
    Organization,
    OrganizationToUserLink,
}
