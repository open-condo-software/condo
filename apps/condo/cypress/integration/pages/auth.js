/* eslint-disable no-undef */

import { SignIn, ForgotPassword, ChangePassword, Registration }  from '../../objects/Auth'
import faker from 'faker'

describe('Auth scenarios', () => {

    describe('User', () => {
        it('can signin with correct password and phone', () => {
            const createUser = cy.task('keystone:createUser')
            createUser.then(([, user]) => {
                const signIn = new SignIn()
                signIn
                    .visit()
                    .fillPhone(user.phone)
                    .fillPassword(user.password)
                    .signinClick()
            })
        })
        it('can start password recovery', () => {
            const createUser = cy.task('keystone:createUser')
            createUser.then(([, user]) => {
                const forgot = new ForgotPassword()
                forgot
                    .visit()
                    .fillPhone(user.phone)
                    .startPasswordRecoveryClick()
                    .checkSuccess()
            })
        })
        it('can complete reset password with valid token', () => {
            const createUser = cy.task('keystone:createUser')
            const newPassword = faker.internet.password()
            createUser.then(([user]) => {
                const createForgotPasswordAction = cy.task('keystone:createForgotPasswordAction', user)
                createForgotPasswordAction.then(([{ token }]) => {
                    const changePassword = new ChangePassword()
                    changePassword
                        .visit(token)
                        .fillPassword(newPassword)
                        .fillConfirmPassword(newPassword)
                        .changePasswordClick()
                })
            })
        })
    })
    describe('Anonymous', () => {
        it('can register after confirming phone', () => {
            const registration = new Registration()
            const user = {
                phone: faker.phone.phoneNumber('+7922#######'),
                password: faker.internet.password(),
                email: faker.internet.email(),
                name: `${faker.name.firstName()} ${faker.name.lastName()}`,
            }
            // step 1
            registration
                .visit()
                .fillPhone(user.phone)
                .startRegistrationClick()
            cy.url().should('contain', 'token=')
            const getSmsCode = cy.task('keystone:getConfirmPhoneAction', user.phone)
            getSmsCode.then(([{ smsCode }]) => {
                // step 2
                registration.fillSMSCode(smsCode)
                // step 3
                registration
                    .fillName(user.name)
                    .fillEmail(user.email)
                    .fillPassword(user.password)
                    .fillConfirmPassword(user.password)
                    .completeRegistrationClick()
            })
        })
    })
})