interface GifFrames {
  frames: ImageBitmap[]
  starts: number[]
  total: number
}

interface DecoderLike {
  tracks: { ready: Promise<void>; selectedTrack?: { frameCount: number } }
  decode(options: { frameIndex: number }): Promise<{ image: VideoFrame & { duration: number | null } }>
  close(): void
}

const cache = new Map<string, GifFrames | 'loading' | 'failed'>()

// Decodes a GIF once into bitmaps so the canvas can show every frame (drawImage alone only shows frame 0).
async function decode(src: string): Promise<GifFrames> {
  const Decoder = (globalThis as unknown as { ImageDecoder?: new (init: object) => DecoderLike }).ImageDecoder
  if (!Decoder) throw new Error('ImageDecoder unavailable')
  const response = await fetch(src)
  const decoder = new Decoder({ data: await response.arrayBuffer(), type: 'image/gif' })
  await decoder.tracks.ready
  const count = decoder.tracks.selectedTrack?.frameCount ?? 1
  const frames: ImageBitmap[] = []
  const starts: number[] = []
  let total = 0
  for (let index = 0; index < count; index += 1) {
    const { image } = await decoder.decode({ frameIndex: index })
    frames.push(await createImageBitmap(image))
    starts.push(total)
    total += Math.max(20, (image.duration ?? 100000) / 1000)
    image.close()
  }
  decoder.close()
  return { frames, starts, total }
}

export function getGifFrame(src: string, elapsedMs: number): ImageBitmap | null {
  const entry = cache.get(src)
  if (entry === undefined) {
    cache.set(src, 'loading')
    decode(src).then(
      (gif) => cache.set(src, gif),
      () => cache.set(src, 'failed'),
    )
    return null
  }
  if (entry === 'loading' || entry === 'failed') return null

  const time = elapsedMs % entry.total
  let index = entry.frames.length - 1
  while (index > 0 && entry.starts[index] > time) index -= 1
  return entry.frames[index]
}

export function isGifFailed(src: string): boolean {
  return cache.get(src) === 'failed'
}
