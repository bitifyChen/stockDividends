export const industryChainStageLabels = {
  upstream: '上游',
  midstream: '中游',
  downstream: '下游',
  application: '應用',
  service: '服務'
}

export const normalizeIndustryChainCode = (code) => String(code || '').trim()

export const getIndustryChainName = (node, fallback = '未命名節點') => node?.name || fallback

export const getIndustryChainCount = (node) => {
  const value = node?.stock_count ?? node?.direct_stock_count ?? node?.count ?? null
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

export const getIndustryChainDirectCount = (node) => {
  const value = node?.direct_stock_count ?? null
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

export const getIndustryChainStageLabel = (stage) =>
  industryChainStageLabels[stage] || (stage ? String(stage) : '未分段')

export const flattenIndustryChainTree = (nodes = [], depth = 0, parent = null) => {
  if (!Array.isArray(nodes)) return []

  return nodes.flatMap((node) => {
    const children = Array.isArray(node?.children) ? node.children : []
    return [
      {
        ...node,
        depth,
        parent
      },
      ...flattenIndustryChainTree(children, depth + 1, node)
    ]
  })
}

export const normalizeIndustryChainTree = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.items)) return response.items
  if (Array.isArray(response?.data)) return response.data
  if (response?.item) return [response.item]
  if (response?.tree) return Array.isArray(response.tree) ? response.tree : [response.tree]
  return []
}

export const normalizeIndustryChainNode = (response) =>
  response?.item || response?.data || response || null

export const hasIndustryChainStocks = (node) => {
  if (node?.disabled === true) return false
  const count = getIndustryChainCount(node)
  return count === null || count > 0
}
