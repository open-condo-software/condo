/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */

import { Home, HOME_PAGE_URL }  from '../../objects/Home'
import { Registration }  from '../../objects/Registration'
import { SignIn }  from '../../objects/SignIn'
import { ForgotPassword }  from '../../objects/ForgotPassword'
import { ChangePassword }  from '../../objects/ChangePassword'
import user from '../../fixtures/user.json'
// import expect from 'expect' // jest

describe('Auth', () => {
    describe('Valid user', () => {

        it('can register', () => {
            const registration = new Registration()

            registration
                .visit() // step 1
                .fillPhone(user.phone)
                .startRegistrationClick()
                .fillSMSCode(user.sms) // step 2
                .fillName(user.name) // step 3
                .fillEmail(user.email)
                .fillPassword(user.password)
                .fillConfirmPassword(user.password)
                .completeRegistrationClick()

            cy.url().should('eq', `${HOME_PAGE_URL}/`)
        })

        it('can signin', () => {
            const signIn = new SignIn()

            signIn
                .visit()
                .fillPhone(user.phone)
                .fillPassword(user.password)
                .signinClick()

            cy.url().should('eq', `${HOME_PAGE_URL}/`)
        })

        it('can start reset password', () => {
            const forgotPassword = new ForgotPassword()

            forgotPassword
                .visit()
                .fillEmail(user.email)
                .startPasswordRecoveryClick()
                .checkSuccess()

            cy.url().should('contain', `${HOME_PAGE_URL}/`)
            // check forgot-success-message
        })

        it('can complete reset password with valid token', () => {
            const changePassword = new ChangePassword()
            changePassword
                .visit()
                .fillPassword(user.password)
                .fillConfirmPassword(user.password)
                .changePasswordClick()

            cy.url().should('contain', `${HOME_PAGE_URL}/`)
            const home = new Home()
            home.visit()

        })
    })
})
