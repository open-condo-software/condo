# SymmetricEncryptedText

`SymmetricEncryptedText` field simplifies work with encrypted data. It automatically encrypts text before storing in
database and returning in response, and decrypts it for usage in schema hooks. With CipherManager it allows you to
decrypt old data after encryption config was changed and re encrypt it as you doing queries for models.

## Usage

```js
const { Text } = require('@keystonejs/fields');
const { CipherManager } = require('@open-condo/cipher');
const conf = require('@open-condo/config')
const { getDecryptInfo } = require('@open-condo/keystone/fields/SymmetricEncryptedText/utils/decryptInfo')

const cipherManager = new CipherManager([
    { version: '1', cipher: 'aes-256-cbc', secret: conf.SECRET_VALUE }
], '1')

keystone.createList('User', {
  fields: {
    email: { type: Text },
    nonPublicData: { 
        type: 'SymmetricEncryptedText',
        cipherManager: cipherManager,
        hooks: {
            // here you have decrypted field in all hooks (existingItem)
            resolveInput({resolvedData, existingItem}) {
                // resolvedData.nonPublicData - raw nonPublicData, not encrypted
                // existingItem.nonPublicData - decrypted nonPublicData
            }
        },
    },
  },
  hooks: {
      // here you have decrypted field in all hooks (updatedItem, existingItem)
      afterChanges: async ({ updatedItem, existingItem, context }) => {
          // this won't give you users, because you passing decrypted nonPublicData, and adapter is searching among encrypted ones
          await User.getAll(context, { nonPublicData: updatedItem.nonPublicData })
          // what you need to do in such cases
          const nonPublicDataDecryptInfo = getDecryptInfo(updatedItem, 'nonPublicData') // function will retun 'undefined' if passing anything other than 'updatedItem', 'existingItem'
          const nonPublicDataSameAsStoredInDatabase = cipherManager.encrypt(updatedItem.nonPublicData, nonPublicDataDecryptInfo)
          await User.getAll(context, { nonPublicData: nonPublicDataSameAsStoredInDatabase })
      },   
  }, 
});
```
Create / update mutations should provide raw data, returning field is encrypted
```gql 
mutation {
    result: createUser ($data: { nonPublicData: "raw-data" }) {
        nonPublicData
    }
}

# returns { nonPublicData: "some-encrypted-data-value, as it is stored in database" }
```
Filters in read queries should provide encrypted data
```gql
query {
    objs: allUsers (where: { nonPublicData: "some-encrypted-data-value, as it is stored in database" }) {
        nonPublicData
    }
}

# returns [{ nonPublicData: "some-encrypted-data-value, as it is stored in database" }]
```

## Config extends Text field config

| Option              | Type            | Default | Description                                               |
|---------------------|-----------------|---------|-----------------------------------------------------------|
| `cipherManager`     | `CipherManager` | `-`     | CipherManager instance with versions and default version. |

### `cipherManager`

We are using CipherManager for switching to another algorithm / secret key. This class help to read data, 
encrypted with old keys / algorithms. New data is being stored with CipherManager.defaultVersion

## GraphQL

`SymmetricEncryptedText` fields behave as strings (`Text` field). On create / update operations input value will be
encrypted before storing in database and returning in response. For read operations field expects encrypted value.

## Storage

The value stored is string containing provided version, iv and, encrypted with provided algorithm and secret, provided value.
#### Example: \<version from CipherManager\>:\<iv\>:\<crypted data\>

## Internal steps
1. Create / update operation (mutations)
   - resolvedData[field] contains raw data.
   - Field type hook resolveInput() decrypts existingData[field] and stores service information in it. After that you have decrypted existingData in all your hooks
   - Field type adapter encrypts resolvedData[field] before pasting in database.
   - Field type hook afterChange() decrypts back updatedData[field] and stores service information in it. After that you have decrypted updatedData in afterChange() hook
   - Field type encrypts updatedData[field] back before putting it in response
2. Read operations (queries)
   - Field adapter takes encrypted field from database
   - No hooks were called on query
   - Field type does not modify data and puts field in response encoded, as received from database

## Service information

| Symbol                                  | Format                                 | Description                                                                                                                                                                                                         |
|-----------------------------------------|----------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `SYMMETRIC_ENCRYPTED_TEXT_DECRYPT_INFO` | `{ [fieldPath]: CipherManagerResult }` | Stores information about iv and version after decrypting data during resolveInput(), afterChange() hooks in existingData and updatedData respectfully. This can be used to encrypt data back as it were in database |
