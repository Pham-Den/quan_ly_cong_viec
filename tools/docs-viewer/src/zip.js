import { Buffer } from 'node:buffer'

/**
 * Minimal ZIP writer (STORED / no compression) — enough to bundle the per-phase preview
 * markdown into one downloadable archive without pulling in a zip dependency. Stored entries
 * are valid ZIP and open everywhere; we don't need compression for a handful of small files.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

export function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = (CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)) >>> 0
  return (c ^ 0xffffffff) >>> 0
}

const DOS_DATE = 0x21 // 1980-01-01 — fixed so archives are byte-deterministic
const DOS_TIME = 0x00

/**
 * Build a ZIP archive (Buffer) from `[{ name, data }]` where data is a Buffer or string.
 * Entries are stored uncompressed. Names should use forward slashes.
 */
export function makeZip(files) {
  const toBuf = (d) => (Buffer.isBuffer(d) ? d : Buffer.from(String(d), 'utf8'))
  const localChunks = []
  const centralChunks = []
  let offset = 0

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8')
    const data = toBuf(file.data)
    const crc = crc32(data)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0) // local file header signature
    local.writeUInt16LE(20, 4) // version needed to extract
    local.writeUInt16LE(0, 6) // flags
    local.writeUInt16LE(0, 8) // method: 0 = stored
    local.writeUInt16LE(DOS_TIME, 10)
    local.writeUInt16LE(DOS_DATE, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18) // compressed size
    local.writeUInt32LE(data.length, 22) // uncompressed size
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28) // extra length
    localChunks.push(local, nameBuf, data)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0) // central directory header signature
    central.writeUInt16LE(20, 4) // version made by
    central.writeUInt16LE(20, 6) // version needed
    central.writeUInt16LE(0, 8) // flags
    central.writeUInt16LE(0, 10) // method
    central.writeUInt16LE(DOS_TIME, 12)
    central.writeUInt16LE(DOS_DATE, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt16LE(0, 30) // extra
    central.writeUInt16LE(0, 32) // comment
    central.writeUInt16LE(0, 34) // disk number
    central.writeUInt16LE(0, 36) // internal attrs
    central.writeUInt32LE(0, 38) // external attrs
    central.writeUInt32LE(offset, 42) // offset of local header
    centralChunks.push(central, nameBuf)

    offset += local.length + nameBuf.length + data.length
  }

  const centralDir = Buffer.concat(centralChunks)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0) // end of central directory signature
  end.writeUInt16LE(0, 4) // disk number
  end.writeUInt16LE(0, 6) // central dir start disk
  end.writeUInt16LE(files.length, 8) // entries on this disk
  end.writeUInt16LE(files.length, 10) // total entries
  end.writeUInt32LE(centralDir.length, 12) // central dir size
  end.writeUInt32LE(offset, 16) // central dir offset
  end.writeUInt16LE(0, 20) // comment length

  return Buffer.concat([...localChunks, centralDir, end])
}
