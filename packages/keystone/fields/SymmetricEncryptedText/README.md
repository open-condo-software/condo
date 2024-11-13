# SymmetricEncryptedText

`SymmetricEncryptedText` field simplifies work with encrypted data. It automatically encrypts text before storing in
database and allows you to store data encrypted with different versions of keys.

## Basic usage
Just add field type and now your data is encrypted. You can handle decryption later

```js
const { Text } = require('@keystonejs/fields');
const conf = require('@open-condo/config')

keystone.createList('User', {
  fields: {
    email: { type: Text },
    nonPublicData: { type: 'SymmetricEncryptedText' },
  },
});
```

## Normal usage
Create EncryptionManager separately, so you can use it elsewhere to decrypt data

```js
const { Text } = require('@keystonejs/fields');
const { EncryptionManager } = require('@open-condo/keystone/crypto/EncryptionManager');
const conf = require('@open-condo/config')

const UserCrypto = {
    nonPublicData: new EncryptionManager()
}

keystone.createList('User', {
  fields: {
    email: { type: Text },
    nonPublicData: { 
        type: 'SymmetricEncryptedText',
        encryptionManager: UserCrypto.nonPublicData,
        hooks: {
            resolveInput({ existingItem }) {
                const decryptedNonPublicData = UserCrypto.nonPublicData.decrypt(existingItem.nonPublicData)
            }
        },
    },
  },
  hooks: {
      afterChanges: async ({ updatedItem }) => {
         const decryptedNonPublicData = UserCrypto.nonPublicData.decrypt(updatedItem.nonPublicData)
      },   
  }, 
});
```

## Specific usage

```js
const { Text } = require('@keystonejs/fields');
const { EncryptionManager } = require('@open-condo/keystone/crypto/EncryptionManager');
const conf = require('@open-condo/config')

const UserCrypto = {
    nonPublicData: new EncryptionManager({
       customConfig: [{ id: 'versionId', algorithm: 'crypto algorithm', secret: 'your secret key' }],
       useDefaultConfig: false, // default - true
       useDefaultAsCurrent: false, // default - false. Only for specific cases when you want to return to default versions
    })
}

keystone.createList('User', {
  fields: {
      email: {type: Text},
      nonPublicData: {
          type: 'SymmetricEncryptedText',
          encryptionManager: UserCrypto.nonPublicData,
      },
  }
});
```

## Config extends Text field config

| Option              | Type                | Default                   | Description                               |
|---------------------|---------------------|---------------------------|-------------------------------------------|
| `encryptionManager` | `EncryptionManager` | `new EncryptionManager()` | EncryptionManager instance with versions. |

### `encryptionManager`

We are using EncryptionManager for switching between algorithms / secret keys. This class helps to read data, 
encrypted with old keys / algorithms. New data is being stored with CipherManager._currentVersion

## GraphQL

`SymmetricEncryptedText` fields behave as strings (`Text` field). On create / update operations input value will be
encrypted before storing in database and returning in response. For read operations field expects encrypted value.

## Storage

The value stored is string containing provided version, iv and, encrypted with provided algorithm and secret, provided value.
#### Example: \<version from CipherManager\>:\<crypted data\>:\<iv\>

## Service information

| Env                                  | Format                                                | Description      |
|--------------------------------------|-------------------------------------------------------|------------------|
| `DEFAULT_KEYSTONE_ENCRYPTION_CONFIG` | `{ id: string, algorithm: string, secret: string }[]` | Default versions |
