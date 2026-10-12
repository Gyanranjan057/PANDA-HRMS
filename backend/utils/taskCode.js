export const toTaskCode = id => `TSK-${id}`

export const parseTaskCode = code => {
  const match = /^TSK-(\d+)$/i.exec(String(code))
  return match ? Number(match[1]) : null
}