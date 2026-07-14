type HeaderPair = {
  key: string
  value: string
}

export type CurlImportDraft = {
  method: string
  url: string
  query: HeaderPair[]
  headers: HeaderPair[]
  bodyType: string
  bodyText: string | null
}

function tokenize(command: string) {
  const tokens: string[] = []
  let token = ''
  let quote: '"' | "'" | null = null
  let escaping = false

  for (const char of command.trim()) {
    if (escaping) {
      token += char
      escaping = false
      continue
    }

    if (char === '\\') {
      escaping = true
      continue
    }

    if (quote) {
      if (char === quote) {
        quote = null
      } else {
        token += char
      }
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      continue
    }

    if (/\s/.test(char)) {
      if (token) {
        tokens.push(token)
        token = ''
      }
      continue
    }

    token += char
  }

  if (token) {
    tokens.push(token)
  }

  return tokens
}

function splitHeader(header: string): HeaderPair | null {
  const separatorIndex = header.indexOf(':')

  if (separatorIndex <= 0) {
    return null
  }

  return {
    key: header.slice(0, separatorIndex).trim(),
    value: header.slice(separatorIndex + 1).trim(),
  }
}

function parseFlagValue(token: string, flag: string) {
  return token.startsWith(`${flag}=`) ? token.slice(flag.length + 1) : null
}

function normalizeUrl(rawUrl: string) {
  const url = new URL(rawUrl)
  const query = Array.from(url.searchParams.entries()).map(([key, value]) => ({ key, value }))

  url.search = ''

  return {
    url: url.toString(),
    query,
  }
}

export function parseCurlCommand(command: string): CurlImportDraft {
  const tokens = tokenize(command)

  if (tokens[0] !== 'curl') {
    throw new Error('INVALID_CURL')
  }

  let method = 'GET'
  let rawUrl = ''
  let bodyText: string | null = null
  const headers: HeaderPair[] = []

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index] ?? ''
    const requestMethod = parseFlagValue(token, '--request')
    const headerValue = parseFlagValue(token, '--header')
    const dataValue =
      parseFlagValue(token, '--data') ??
      parseFlagValue(token, '--data-raw') ??
      parseFlagValue(token, '--data-binary') ??
      parseFlagValue(token, '--data-urlencode')
    const urlValue = parseFlagValue(token, '--url')

    if (token === '-X' || token === '--request') {
      method = (tokens[index + 1] ?? method).toUpperCase()
      index += 1
      continue
    }

    if (token.startsWith('-X') && token.length > 2) {
      method = token.slice(2).toUpperCase()
      continue
    }

    if (requestMethod !== null) {
      method = requestMethod.toUpperCase()
      continue
    }

    if (token === '-H' || token === '--header') {
      const header = splitHeader(tokens[index + 1] ?? '')

      if (header) {
        headers.push(header)
      }

      index += 1
      continue
    }

    if (headerValue !== null) {
      const header = splitHeader(headerValue)

      if (header) {
        headers.push(header)
      }

      continue
    }

    if (['-d', '--data', '--data-raw', '--data-binary', '--data-urlencode'].includes(token)) {
      bodyText = tokens[index + 1] ?? ''
      method = method === 'GET' ? 'POST' : method
      index += 1
      continue
    }

    if (dataValue !== null) {
      bodyText = dataValue
      method = method === 'GET' ? 'POST' : method
      continue
    }

    if (token === '--url') {
      rawUrl = tokens[index + 1] ?? rawUrl
      index += 1
      continue
    }

    if (urlValue !== null) {
      rawUrl = urlValue
      continue
    }

    if (!token.startsWith('-') && /^https?:\/\//i.test(token)) {
      rawUrl = token
    }
  }

  if (!rawUrl) {
    throw new Error('INVALID_CURL')
  }

  const normalizedUrl = normalizeUrl(rawUrl)
  const contentType = headers.find((header) => header.key.toLowerCase() === 'content-type')?.value ?? ''
  const bodyType =
    bodyText && (contentType.includes('json') || /^[\[{]/.test(bodyText.trim())) ? 'JSON' : bodyText ? 'TEXT' : 'NONE'

  return {
    method,
    url: normalizedUrl.url,
    query: normalizedUrl.query,
    headers,
    bodyType,
    bodyText,
  }
}
