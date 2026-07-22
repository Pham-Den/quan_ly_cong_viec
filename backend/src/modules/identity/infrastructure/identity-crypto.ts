import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

import {
  IdentityKeyProviderUnavailableError,
  type EncryptedIdentityValue,
  type IdentityKeyPort,
} from '../domain/index.js'

// Sprint: v1 | Feature: NFR-004/NFR-010 | Task Group: 02 Identity persistence
// Contract: AES-256-GCM + SHA-256 selector protection | Pack: v1.7.21-oidc-session-error-contracts
export const IDENTITY_NONCE_BYTES = 12
export const IDENTITY_TAG_BYTES = 16
export const IDENTITY_KEY_BYTES = 32

export interface IdentityKeyResolver {
  resolve(keyId: string): Promise<Uint8Array>
}

export { sha256 } from '../domain/index.js'

export class Aes256GcmIdentityKeyAdapter implements IdentityKeyPort {
  constructor(
    private readonly keys: IdentityKeyResolver,
    private readonly nonceFactory: () => Uint8Array = () => randomBytes(IDENTITY_NONCE_BYTES),
  ) {}

  async encrypt(plaintext: Uint8Array, keyId: string): Promise<EncryptedIdentityValue> {
    try {
      const key = await this.resolveKey(keyId)
      const nonce = Buffer.from(this.nonceFactory())
      if (nonce.byteLength !== IDENTITY_NONCE_BYTES) {
        throw new RangeError(`AES-GCM nonce must be ${IDENTITY_NONCE_BYTES} bytes.`)
      }

      const cipher = createCipheriv('aes-256-gcm', key, nonce, { authTagLength: IDENTITY_TAG_BYTES })
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
      return { ciphertext, nonce, tag: cipher.getAuthTag(), keyId }
    } catch (error) {
      if (error instanceof IdentityKeyProviderUnavailableError) throw error
      throw new IdentityKeyProviderUnavailableError(error)
    }
  }

  async decrypt(value: EncryptedIdentityValue): Promise<Uint8Array> {
    try {
      if (value.nonce.byteLength !== IDENTITY_NONCE_BYTES || value.tag.byteLength !== IDENTITY_TAG_BYTES) {
        throw new RangeError('Encrypted identity value has an invalid nonce or authentication tag.')
      }
      const key = await this.resolveKey(value.keyId)
      const decipher = createDecipheriv('aes-256-gcm', key, value.nonce, {
        authTagLength: IDENTITY_TAG_BYTES,
      })
      decipher.setAuthTag(Buffer.from(value.tag))
      return Buffer.concat([decipher.update(value.ciphertext), decipher.final()])
    } catch (error) {
      if (error instanceof IdentityKeyProviderUnavailableError) throw error
      throw new IdentityKeyProviderUnavailableError(error)
    }
  }

  private async resolveKey(keyId: string): Promise<Buffer> {
    if (!keyId || keyId.length > 128) {
      throw new RangeError('Identity key ID must contain 1–128 characters.')
    }
    const key = Buffer.from(await this.keys.resolve(keyId))
    if (key.byteLength !== IDENTITY_KEY_BYTES) {
      throw new RangeError(`AES-256-GCM key must be ${IDENTITY_KEY_BYTES} bytes.`)
    }
    return key
  }
}
