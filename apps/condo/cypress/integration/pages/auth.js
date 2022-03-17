import { SignIn, ForgotPassword, Registration }  from '../../objects/Auth'
import faker from 'faker'

describe('Auth scenarios', () => {

    describe('User', () => {
        it('can start password recovery', () => {
            cy.task('keystone:createUser').then(([, user]) => {
                const forgot = new ForgotPassword()
                forgot
                    .visit()
                    .fillPhone(user.phone)
                    .startPasswordRecoveryClick()
                    .checkSuccess()
            })
        })
        it('can signin with correct password and phone', () => {
            cy.task('keystone:createUser').then(([, user]) => {
                const signIn = new SignIn()
                signIn
                    .visit()
                    .fillPhone(user.phone)
                    .fillPassword(user.password)
                    .signinClick()
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
                .clickCheckbox()
                .startRegistrationClick()
            cy.url().should('contain', 'token=')

            cy.task('keystone:getConfirmPhoneAction', user.phone).then(([{ smsCode }]) => {
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
