interface FigmaParseResult {
  fileKey: string
  nodeId: string | null
  label: string
}

export function parseFigmaUrl(url: string): FigmaParseResult {
  // Supports:
  // https://www.figma.com/file/{fileKey}/Title?node-id=123-456
  // https://www.figma.com/design/{fileKey}/Title?node-id=123:456
  // https://www.figma.com/proto/{fileKey}/...
  const match = url.match(/figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/)
  if (!match) throw new Error('Link Figma không hợp lệ. Định dạng đúng: figma.com/design/...')

  const fileKey = match[1]

  // Extract node-id from query string
  const urlObj = new URL(url)
  const rawNodeId = urlObj.searchParams.get('node-id')
  // Figma uses both "123:456" and "123-456" formats — normalize to "123:456"
  const nodeId = rawNodeId ? rawNodeId.replace('-', ':') : null

  // Build a short label for display
  const pathParts = urlObj.pathname.split('/').filter(Boolean)
  const titleSlug = pathParts[2] || fileKey
  const label = decodeURIComponent(titleSlug).replace(/-/g, ' ').slice(0, 60)

  return { fileKey, nodeId, label }
}

interface FigmaFetchResult {
  imageBase64: string
  imageMime: string
  name: string
  label: string
}

export async function fetchFigmaFrame(url: string, token: string): Promise<FigmaFetchResult> {
  const { fileKey, nodeId, label } = parseFigmaUrl(url)

  let imageUrl: string

  if (nodeId) {
    // Fetch specific frame/component by node-id
    const apiUrl = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`
    const res = await fetch(apiUrl, { headers: { 'X-Figma-Token': token } })

    if (res.status === 403) throw new Error('Figma token không hợp lệ hoặc không có quyền truy cập file này.')
    if (res.status === 404) throw new Error('Không tìm thấy Figma file. Kiểm tra link hoặc quyền truy cập.')
    if (!res.ok) throw new Error(`Figma API lỗi: ${res.status}`)

    const data = await res.json()
    if (data.err) throw new Error(`Figma lỗi: ${data.err}`)

    const normalizedId = nodeId.replace(':', '-')
    imageUrl = data.images?.[nodeId] || data.images?.[normalizedId]
    if (!imageUrl) throw new Error('Figma không trả về ảnh cho node này. Thử chọn frame cụ thể hơn.')
  } else {
    // No node-id → fetch file thumbnail
    const metaRes = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=1`, {
      headers: { 'X-Figma-Token': token },
    })
    if (metaRes.status === 403) throw new Error('Figma token không hợp lệ hoặc không có quyền truy cập file này.')
    if (!metaRes.ok) throw new Error(`Figma API lỗi: ${metaRes.status}`)

    const meta = await metaRes.json()
    imageUrl = meta.thumbnailUrl
    if (!imageUrl) throw new Error('Figma file không có thumbnail. Thử copy link của một frame cụ thể.')
  }

  // Download the image and convert to base64
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error('Không tải được ảnh từ Figma. Thử lại sau.')

  const rawBuffer = Buffer.from(await imgRes.arrayBuffer())

  // Resize to max 4000px on longest side so Claude vision API accepts it (limit: 8000px)
  const sharp = (await import('sharp')).default
  const resized = await sharp(rawBuffer)
    .resize(4000, 4000, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer()

  const imageBase64 = resized.toString('base64')
  const imageMime = 'image/png'

  return {
    imageBase64,
    imageMime,
    name: label,
    label,
  }
}
