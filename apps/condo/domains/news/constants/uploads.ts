export const SIZE_LIMIT_BY_FILE_TYPE = {
    image: {
        extensions: ['JPG', 'PNG', 'WEBP', 'HEIC'],
        limitSizeInMb: 10,
    },
    video: {
        extensions: ['MP4', 'MOV'],
        limitSizeInMb: 50,
    },
    documents: {
        extensions: ['PDF', 'TXT', 'DOC', 'EXEL', 'ZIP'],
        limitSizeInMb: 10,
    },
}
