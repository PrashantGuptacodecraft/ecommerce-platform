// Minimal image dimension parser for Next.js server

export type ImageMetadata = {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif'
  width: number
  height: number
}

export function parseImageMetadata(buffer: Buffer): ImageMetadata {
  // Check PNG
  if (buffer.length >= 24 && buffer.readUInt32BE(0) === 0x89504e47) {
    if (buffer.toString('ascii', 12, 16) === 'IHDR') {
      return {
        mimeType: 'image/png',
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      }
    }
  }

  // Check JPEG
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset < buffer.length) {
      while (buffer[offset] === 0xff) offset++
      const marker = buffer[offset]
      offset++
      if (marker === undefined) break
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
      if (marker === 0xd9 || marker === 0xda) break
      const length = buffer.readUInt16BE(offset)
      // SOF0 - SOF15 (excluding DHT, JPG, DAC)
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        return {
          mimeType: 'image/jpeg',
          height: buffer.readUInt16BE(offset + 3),
          width: buffer.readUInt16BE(offset + 5),
        }
      }
      offset += length
    }
  }

  // Check WebP
  if (
    buffer.length >= 30 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const type = buffer.toString('ascii', 12, 16)
    if (type === 'VP8 ') {
      // VP8 requires to read 10 bytes after chunk header (8 bytes)
      return {
        mimeType: 'image/webp',
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      }
    } else if (type === 'VP8L') {
      const b1 = buffer[21] || 0
      const b2 = buffer[22] || 0
      const b3 = buffer[23] || 0
      const b4 = buffer[24] || 0
      const width = 1 + (((b2 & 0x3f) << 8) | b1)
      const height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6))
      return { mimeType: 'image/webp', width, height }
    } else if (type === 'VP8X') {
      const width = 1 + buffer.readUIntLE(24, 3)
      const height = 1 + buffer.readUIntLE(27, 3)
      return { mimeType: 'image/webp', width, height }
    }
  }

  // Check AVIF
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 4, 8) === 'ftyp' &&
    buffer.toString('ascii', 8, 12) === 'avif'
  ) {
    // Minimal naive search for "ispe" (Image Spatial Extent) box
    let offset = 0
    while (offset < buffer.length - 12) {
      const boxSize = buffer.readUInt32BE(offset)
      const boxType = buffer.toString('ascii', offset + 4, offset + 8)
      if (boxType === 'ispe' && offset + 12 <= buffer.length) {
        return {
          mimeType: 'image/avif',
          width: buffer.readUInt32BE(offset + 12),
          height: buffer.readUInt32BE(offset + 16),
        }
      }
      // If meta box, just skip the 4 byte header and 4 byte version/flags and continue looking inside
      if (boxType === 'meta') {
        offset += 12
        continue
      }
      if (boxType === 'moov' || boxType === 'trak' || boxType === 'mdia' || boxType === 'minf' || boxType === 'stbl' || boxType === 'iprp' || boxType === 'ipco') {
        offset += 8
        continue
      }
      if (boxSize < 8) break
      offset += boxSize
    }
    // Very naive fallback if ispe search fails but we know it's avif
    throw new Error('AVIF ispe box not found')
  }

  throw new Error('Unsupported image format or invalid magic bytes')
}
