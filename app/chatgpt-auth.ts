import { headers } from 'next/headers'

export interface ChatGPTUser { email: string; displayName: string }

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers()
  const email = requestHeaders.get('oai-authenticated-user-email')
  if (!email) return null
  const encodedName = requestHeaders.get('oai-authenticated-user-full-name')
  const encoding = requestHeaders.get('oai-authenticated-user-full-name-encoding')
  let displayName = email
  if (encodedName && encoding === 'percent-encoded-utf-8') {
    try { displayName = decodeURIComponent(encodedName) } catch { displayName = email }
  }
  return { email, displayName }
}
