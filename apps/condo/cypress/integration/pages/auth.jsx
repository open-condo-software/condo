/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */

import { HomePage, HOME_PAGE_URL }  from '../../objects/HomePage'
import { Registration }  from '../../objects/Registration'
import { SignIn }  from '../../objects/SignIn'
import { ForgotPassword }  from '../../objects/ForgotPassword'
import { ChangePassword }  from '../../objects/ChangePassword'
import user from '../../fixtures/user.json'

describe('Auth', () => {
    describe('Valid user', () => {

        it('can register', () => {
            const registration = new Registration()
            registration.visit()
            registration
                .fillPhone(user.phone)
                .startRegistration()
            registration
                .fillSMSCode(user.sms)
            registration
                .fillName(user.name)
                .fillEmail(user.email)
                .fillPassword(user.password)
                .fillConfirmPassword(user.password)
                .completeRegistration()
            cy.url().should('eq', HOME_PAGE_URL)
        })

        it('can signin', () => {
            const signIn = new SignIn()
            signIn.visit()
            signIn
                .fillPhone(user.phone)
                .fillPassword(user.password)
                .signin()
            cy.url().should('eq', HOME_PAGE_URL)
        })

        it('can start reset password', () => {
            const forgotPassword = new ForgotPassword()
            forgotPassword.visit()
            forgotPassword
                .fillEmail(user.email)
                .startPasswordRecovery()
            // check forgot-success-message
        })

        it('can complete reset password with valid token', () => {
            const changePassword = new ChangePassword()
            changePassword.visit()
            changePassword
                .fillPassword(user.password)
                .fillConfirmPassword(user.password)
                .changePassword()
        })
    })
})
