import App from '../src/App'
import { PlannerProvider } from '../src/store/PlannerContext'
import { getChatGPTUser } from './chatgpt-auth'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const user = await getChatGPTUser()
  return <PlannerProvider cloudUser={user?.email ?? null}><App /></PlannerProvider>
}
