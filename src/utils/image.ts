export async function compressImage(file: File, maxSide = 1600, quality = 0.78): Promise<string> {
  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = URL.createObjectURL(file)
  })
  const ratio = Math.min(1, maxSide / Math.max(source.naturalWidth, source.naturalHeight))
  const canvas = document.createElement('canvas'); canvas.width = Math.round(source.naturalWidth * ratio); canvas.height = Math.round(source.naturalHeight * ratio)
  canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(source.src)
  return canvas.toDataURL('image/jpeg', quality)
}
