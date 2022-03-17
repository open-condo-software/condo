/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

const SIGNIN_URL = '/auth/signin/'
const FORGOT_PASSWORD_URL = '/auth/forgot'
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
        cy.get('[data-cy=signin-phone-item] input')
            .clear()
            .type(value)
        return this
    }

    fillPassword (value) {
        cy.get('[data-cy=signin-password-item] input')
            .clear()
            .type(value)
        return this
    }

    signinClick () {
        cy.get('[data-cy=signin-button]')
            .click()
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
        cy.waitForCaptcha()
        cy.get('[data-cy=forgot-phone-item] input')
            .clear()
            .type(value)
        return this
    }

    startPasswordRecoveryClick () {
        // This combination can be moved to custom click command, or we can override click
        cy.get('[data-cy=forgot-button]')
            .trigger('mouseover')
            .trigger('click')
        return this
    }

    checkSuccess () {
        cy.get('[data-cy=forgot-success-message]')
        return this
    }

}

class Registration {
/*
    Elements:
        Step 1
            register-phone-item
            register-personal-data-checkbox
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
        cy.get('[data-cy=register-phone-item] input')
            .clear()
            .type(value)
        return this
    }

    clickCheckbox () {
        cy.get('[data-cy=register-personal-data-checkbox]')
            .click()
        return this
    }

    fillSMSCode (value) {
        cy.get('[data-cy=register-smscode-item] input')
            .clear()
            .type(value)
        return this
    }

    fillName (value) {
        cy.get('[data-cy=register-name-item] input')
            .clear()
            .type(value)
        return this
    }

    fillEmail (value) {
        cy.get('[data-cy=register-email-item] input')
            .clear()
            .type(value)
        return this
    }

    fillPassword (value) {
        cy.get('[data-cy=register-password-item] input')
            .clear()
            .type(value)
        return this
    }

    fillConfirmPassword (value) {
        cy.get('[data-cy=register-confirmpassword-item] input')
            .clear()
            .type(value)
        return this
    }

    startRegistrationClick () {
        cy.waitForCaptcha()
        cy.get('[data-cy=register-button]')
            .click()
        return this
    }

    completeRegistrationClick () {
        cy.get('[data-cy=registercomplete-button]')
            .click()
        return this
    }
}

export {
    SignIn,
    ForgotPassword,
    Registration,
}
