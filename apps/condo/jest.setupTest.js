// The mocked module implementation must be placed into __mocks__/MockedClass near the module itself
console.log('🥸Mock some modules')
jest.mock('@open-condo/clients/address-service-client/AddressServiceClient')
jest.mock('@open-condo/clients/finance-info-client')
