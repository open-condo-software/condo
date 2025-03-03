# EncryptedText

`EncryptedText` field simplifies work with encrypted data. It automatically encrypts text before storing in
database and allows you to store data encrypted with different versions of keys.

## Basic usage
Just add field type and now your data is encrypted. You can handle decryption later

```js
const conf = require('@open-condo/config')

keystone.createList('User', {
  fields: {
    email: { type: 'Text' },
    nonPublicData: { type: 'EncryptedText' },
  },
});
```

## Average usage
Create EncryptionManager separately, so you can use it elsewhere to decrypt data

```js
const { EncryptionManager } = require('@open-condo/keystone/crypto/EncryptionManager');
const conf = require('@open-condo/config')

const manager = new EncryptionManager()

keystone.createList('User', {
  fields: {
    email: { type: 'Text' },
    nonPublicData: { 
        type: 'EncryptedText',
        encryptionManager: manager,
        hooks: {
            resolveInput({ existingItem }) {
                const decryptedNonPublicData = manager.decrypt(existingItem.nonPublicData)
            }
        },
    },
  },
  hooks: {
      afterChanges: async ({ updatedItem }) => {
         const decryptedNonPublicData = manager.decrypt(updatedItem.nonPublicData)
      },   
  }, 
});
```

## Advanced usage
If you want to configure EncryptionManager yourself

```js
const { EncryptionManager } = require('@open-condo/keystone/crypto/EncryptionManager');
const conf = require('@open-condo/config')

const manager = new EncryptionManager({
       versions: { 
           'versionId':  { 
               algorithm: 'crypto algorithm',
               secret: 'your secret key',
               compressor: '...', // defaults to noop
               keyDeriver: '...', // defaults to noop
           }
       },
       encryptionVersionId: 'versionId'
    })

keystone.createList('User', {
  fields: {
      email: {type: 'Text'},
      nonPublicData: {
          type: 'EncryptedText',
          encryptionManager: manager,
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
encrypted with old keys / algorithms. New data is being stored with CipherManager._encryptionVersionId

## GraphQL

`EncryptedText` fields behave as strings (`Text` field). On create / update operations input value will be
encrypted before storing in database and returning in response. For read operations field expects encrypted value.

## Storage

The value stored is string containing provided version, iv and, encrypted with provided algorithm and secret, provided value.
#### Example: \<our string to mark text encrypted\>:\<version from CipherManager\>:\<crypted data\>:\<iv or other service info\>

## Service information

| Env                          | Format                                                                                              | Description                                                       |
|------------------------------|-----------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| `DATA_ENCRYPTION_CONFIG`     | `{ [id: string]: { algorithm: string, secret: string, compressor?: string, keyDeriver?: string } }` | Default versions                                                  |
| `DATA_ENCRYPTION_VERSION_ID` | `string`                                                                                            | Default version id from default versions to encrypt new data with |
