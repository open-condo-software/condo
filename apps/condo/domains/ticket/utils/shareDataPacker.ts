import crypto from 'crypto'

const ALGORITHM = 'aes256'
const KEY = '900150983cd24fb0d6963f7d28e17f72'
const CRYPTOENCODING = 'base64'

export function unpackShareData (data: string): string {
    const decipher = crypto.createDecipher(ALGORITHM, KEY)
    const decryptedBuffers = [decipher.update(data, CRYPTOENCODING), decipher.final()]
    const decryptedText = Buffer.concat(decryptedBuffers).toString('utf8')
    return decryptedText
}


export function packShareData (data: string): string {
    const cipher = crypto.createCipher(ALGORITHM, KEY)
    const encryptedBuffers = [cipher.update(data, 'utf8'), cipher.final()]
    const encryptedText = Buffer.concat(encryptedBuffers).toString(CRYPTOENCODING)
    return encryptedText
}
