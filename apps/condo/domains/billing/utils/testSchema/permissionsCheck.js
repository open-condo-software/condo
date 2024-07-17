const { expectToThrowAccessDeniedErrorToObj, expectToThrowAuthenticationErrorToObj } = require('@open-condo/keystone/test.utils')

async function permissionsCheckToObj (name, matrix, utils, actions) {
    const { users = [], create = [], read = [], update = [] } = matrix
    const { create: createAction, update: updateAction, read: readAction } = actions
    for (const [user, permissions] of Object.entries(users)) {
        console.log(user, permissions)

    }

}

module.exports = {
    permissionsCheckToObj,
}

/*
* test('anonymous: can not get payment rule', async () => {
            await expectToThrowAuthenticationErrorToObj(async () => {

            })
        })
        test('user: can not get payment rule', async () => {
            await expectToThrowAccessDeniedErrorToObj(async () => {
            })
        })
        test('employee: can not get payment rule', async () => {
            await expectToThrowAccessDeniedErrorToObj(async () => {
            })
        })
        test('service user: can not get payment rule', async () => {
            await expectToThrowAccessDeniedErrorToObj(async () => {
            })
        })
        test('support: can get payment rule', async () => {

        })
        test('admin: can get payment rule', async () => {

        })
        test('anonymous: can not add payment rule', async () => {
            await expectToThrowAuthenticationErrorToObj(async () => {

            })
        })
        test('user: can not add payment rule', async () => {
            await expectToThrowAccessDeniedErrorToObj(async () => {
            })
        })
        test('employee: can not add payment rule', async () => {
            await expectToThrowAccessDeniedErrorToObj(async () => {
            })
        })
        test('service user: can not add payment rule', async () => {
            await expectToThrowAccessDeniedErrorToObj(async () => {
            })
        })
        test('support: can add payment rule', async () => {

        })
        test('admin: can add payment rule', async () => {

        })
* */