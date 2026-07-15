export async function getD1() {
  const { env } = await import('cloudflare:workers')
  const bindings = env as unknown as { DB?: D1Database }
  if (!bindings.DB) throw new Error('클라우드 데이터베이스 연결을 사용할 수 없습니다.')
  return bindings.DB
}
