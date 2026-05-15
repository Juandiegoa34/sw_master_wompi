import { loadEnvConfig } from '@next/env'
import { GoogleGenerativeAI } from '@google/generative-ai'

loadEnvConfig(process.cwd())

const key = process.env.GEMINI_API_KEY
if (!key) {
  console.error('GEMINI_API_KEY not found in .env files or env')
  process.exit(1)
}

const client = new GoogleGenerativeAI(key)
const modelLister = client as unknown as {
  listModels?: () => Promise<unknown>
}

async function main() {
  try {
    // try listModels if available
    if (typeof modelLister.listModels === 'function') {
      const res = await modelLister.listModels()
      console.log('listModels result:')
      console.log(JSON.stringify(res, null, 2))
      return
    }

    // fallback: try to query a likely endpoint
    console.log('listModels not available on client')
  } catch (err) {
    console.error('Error listing models:', err)
    process.exit(1)
  }
}

main()
