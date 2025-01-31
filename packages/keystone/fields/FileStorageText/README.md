# FileStorageText

The `FileStorageText` field simplifies the storage of large text data by leveraging file storage solutions, reducing database load, and ensuring efficient handling of large datasets.

## Overview
The `FileStorageText` field is designed to store large text data in an external file storage system instead of directly in the database. This helps avoid database size limitations and improves overall system performance.

You can use this field in your code just like a standard `Text` field, but instead of storing the actual text in the database, only a reference (link) to the file is saved.

## Basic Usage

Add the `FileStorageText` field type to your schema along with a file adapter, and your text data will be stored in a file storage system. Below is an example:

```js
const fileAdapter = new FileAdapter('LOG_FILE_NAME')

keystone.createList('Log', {
  fields: {
    xmlLog: { 
        type: 'FileStorageText',
        adapter: fileAdapter,
    },
  },
});
```

## GraphQL Behavior

The `FileStorageText` field behaves like a standard string (`Text` field) in GraphQL operations:

- **Create/Update:** The input value is saved to the configured file storage, and the database stores only a reference to the saved file.
- **Read:** The saved file is fetched from the file storage, and its contents are returned as a string.

However, the `FileStorageText` field does not support sorting, ordering, filtering, or searching in GraphQL.

## Storage

- **File Storage:** The actual text data is saved as a file in the configured file storage.
- **Database:** Only a reference (link) to the file in the file storage is saved in the database.

This approach keeps the database lightweight and optimized for operations.

## Configuration

You must configure a file adapter to use the `FileStorageText` field. Below are some examples:

```js
const fileAdapter = new FileAdapter('LOG_FILE_NAME')
```

or

```js
const fileAdapter = new FileAdapter('LOG_FILE_NAME', false, false, { bucket: 'BUCKET_FOR_LOGS'})
```

Make sure your file storage system is correctly configured and accessible.

## Notes

- The `FileStorageText` field is ideal for storing large logs, parsed data, or other text values that exceed typical database field size limits.
- Since the text is stored externally as a file, the database remains lean, and operations are more efficient.
- This field does not support sorting, ordering, filtering, or searching in GraphQL. It is designed solely for storing and retrieving large text values.
- Be sure to test your file storage setup to ensure data accessibility and integrity.