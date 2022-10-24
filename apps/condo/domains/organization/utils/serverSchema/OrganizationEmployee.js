const { getItems } = require('@keystonejs/server-side-graphql-client')

/** @deprecated don't use getItems use ServerSide utils */
const getOrganizationEmployee = async ({ context, user, organization }) => {
    const [link] = await getItems({
        ...context,
        listKey: 'OrganizationEmployee',
        where: {
            user: { id: user.id },
            organization: { id: organization.id },
        },
        returnFields: 'id',
    })

    return link
}

module.exports = {
    getOrganizationEmployee,
}