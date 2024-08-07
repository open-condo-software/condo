/**
 * Generated by `createschema condo.User 'name:Text; isSupport:Checkbox; isAdmin:Checkbox; email:Text;'`
 * In most cases you should not change it by hands
 * Please, don't remove `AUTOGENERATE MARKER`s
 */

const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')


const COMMON_FIELDS = 'id dv sender { dv fingerprint } v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt'

const USER_FIELDS = `{ name isSupport isAdmin type ${COMMON_FIELDS} }`
const User = generateGqlQueries('User', USER_FIELDS)

/* AUTOGENERATE MARKER <CONST> */

module.exports = {
    User,
    /* AUTOGENERATE MARKER <EXPORTS> */
}
