import crypto from 'crypto'

const ALGORITHM = 'aes256'
const SALT = '900150983cd24fb0d6963f7d28e17f72'
const CRYPTOENCODING = 'base64'

export function unpackShareData (data: string): string {
    const decipher = crypto.createDecipher(ALGORITHM, SALT)
    const decryptedText = decipher.update(data, CRYPTOENCODING, 'utf8') + decipher.final('utf8')
    return decryptedText
}


export function packShareData (data: string): string {
    const cipher = crypto.createCipher(ALGORITHM, SALT)
    const encryptedText = cipher.update(data, 'utf8', CRYPTOENCODING) + cipher.final(CRYPTOENCODING)
    return encryptedText
}
