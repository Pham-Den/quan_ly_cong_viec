import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const keyLength = 64

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('base64url')
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer

  return `scrypt:${salt}:${derivedKey.toString('base64url')}`
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, encodedHash] = storedHash.split(':')

  if (algorithm !== 'scrypt' || !salt || !encodedHash) {
    return false
  }

  const storedKey = Buffer.from(encodedHash, 'base64url')
  const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer

  if (storedKey.length !== derivedKey.length) {
    return false
  }

  return timingSafeEqual(storedKey, derivedKey)
}
