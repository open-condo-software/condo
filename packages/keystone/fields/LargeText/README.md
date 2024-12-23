# LargeText

The `LargeText` field simplifies the storage of large text data by abstracting the implementation of cloud storage usage.

## Basic Usage

Simply add the `LargeText` field type and a file adapter, and your text data will be stored in cloud storage. This helps avoid storing large datasets directly in the database. You can use it just like a common `Text` field in your code.

```js
const fileAdapter = new FileAdapter('LOG_FILE_NAME')

keystone.createList('Log', {
  fields: {
    xmlLog: { 
        type: 'LargeText',
        adapter: fileAdapter,
    },
  },
});
```

# GraphQL

The `LargeText` field behaves like a standard string (`Text` field). During create/update operations, the input value is saved to cloud storage, and only a reference to the saved file is stored in the database. For read operations, the saved file is downloaded from cloud storage, and its contents are provided as a string.

# Storage

The text value is stored as a file in the cloud, while the database only holds a reference (link) to the source file.

# Configuration

You will need to configure a file adapter to work with cloud storage. Example:

```js
const fileAdapter = new FileAdapter('LOG_FILE_NAME')
```

or

```js
const fileAdapter = new FileAdapter('LOG_FILE_NAME', false, false, { bucket: 'BUCKET_FOR_LOGS'})
```

Ensure your cloud storage configuration is properly set up and accessible for file storage.

# Notes

- The `LargeText` field is ideal for storing large logs, parsed values, or other text data that may exceed the typical size limits of database fields.
- The text is stored as a file in cloud storage, reducing the load on the database while still providing easy access to the data.