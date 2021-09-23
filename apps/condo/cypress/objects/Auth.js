/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */

const SIGNIN_URL = '/auth/signin/'
const FORGOT_PASSWORD_URL = '/auth/forgot'
const CHANGE_PASSWORD_URL = '/auth/change-password?token='
const REGISTER_URL = '/auth/register/'

class SignIn {
/*
    Elements:
        signin-phone-item
        signin-password-item
        signin-button
*/
    visit () {
        cy.visit(SIGNIN_URL)
        return this
    }

    fillPhone (value) {
        const field = cy.get('[data-cy=signin-phone-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillPassword (value) {
        const field = cy.get('[data-cy=signin-password-item] input')
        field.clear()
        field.type(value)
        return this
    }

    signinClick () {
        const button = cy.get('[data-cy=signin-button]')
        button.click()
        return this
    }
}

class ForgotPassword {
/*
    Elements
        forgot-phone-item
        forgot-button
        forgot-success-message
*/
    visit () {
        cy.visit(FORGOT_PASSWORD_URL)
        return this
    }

    fillPhone (value) {
        const field = cy.get('[data-cy=forgot-phone-item] input')
        field.clear()
        field.type(value)
        return this
    }

    startPasswordRecoveryClick () {
        const button = cy.get('[data-cy=forgot-button]')
        // This combination can be moved to custom click command, or we can override click
        button
            .trigger('mouseover')
            .trigger('click')
        return this
    }

    checkSuccess () {
        cy.get('[data-cy=forgot-success-message]')
        return this
    }

}

class ChangePassword {
/*
    Elements:
        changepassword-password-item
        changepassword-confirm-item
        changepassword-button
*/
    visit (token) {
        cy.visit(CHANGE_PASSWORD_URL + token)
        return this
    }

    fillPassword (value) {
        const field = cy.get('[data-cy=changepassword-password-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillConfirmPassword (value) {
        const field = cy.get('[data-cy=changepassword-confirm-item] input')
        field.clear()
        field.type(value)
        return this
    }

    changePasswordClick () {
        const button = cy.get('[data-cy=changepassword-button]')
        button
            .trigger('mouseover')
            .trigger('click')
            .click()
        return this
    }
}


class Registration {
/*
    Elements:
        Step 1
            register-phone-item
            register-button
        Step 2
            register-smscode-item
        Step 3
            register-name-item
            register-email-item
            register-password-item
            register-confirmpassword-item
            registercomplete-button
*/
    visit () {
        cy.visit(REGISTER_URL)
        return this
    }

    fillPhone (value) {
        const field = cy.get('[data-cy=register-phone-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillSMSCode (value) {
        const field = cy.get('[data-cy=register-smscode-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillName (value) {
        const field = cy.get('[data-cy=register-name-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillEmail (value) {
        const field = cy.get('[data-cy=register-email-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillPassword (value) {
        const field = cy.get('[data-cy=register-password-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillConfirmPassword (value) {
        const field = cy.get('[data-cy=register-confirmpassword-item] input')
        field.clear()
        field.type(value)
        return this
    }

    startRegistrationClick () {
        cy.waitForCaptcha()
        const button = cy.get('[data-cy=register-button]')
        button.click()
        return this
    }

    completeRegistrationClick () {
        const button = cy.get('[data-cy=registercomplete-button]')
        button.click()
        return this
    }
}

export {
    SignIn,
    ForgotPassword,
    ChangePassword,
    Registration,
}