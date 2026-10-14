#!/usr/bin/env node
// Creates or updates the Modelflare custom app in Make from the IML files in
// this folder, through Make's SDK Apps API.
//
//   MAKE_API_TOKEN=... [MAKE_ZONE=us2.make.com] node deploy.mjs
//
// The token needs the sdk-apps:read and sdk-apps:write scopes. The app name
// Make assigns on first creation is stored in make-app.json so later runs
// update the same app.
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const token = process.env.MAKE_API_TOKEN
const zone = process.env.MAKE_ZONE || 'us2.make.com'
if (!token) {
  console.error('MAKE_API_TOKEN is required.')
  process.exit(1)
}
const api = `https://${zone}/api/v2`
const VERSION = 1

const MODULES = [
  { dir: 'chat', name: 'chat', label: 'Message a Model', description: 'Sends a prompt to a text model and returns the answer.' },
  { dir: 'generate-image', name: 'generateImage', label: 'Generate an Image', description: 'Generates images with an OpenAI-compatible image model.' },
  { dir: 'create-video', name: 'createVideo', label: 'Create a Video', description: 'Starts a video generation task and returns its task ID.' },
  { dir: 'get-video', name: 'getVideo', label: 'Get a Video', description: 'Gets the status of a video task and, when completed, its result.' },
]
const ACTION_MODULE = 4

async function call(method, pathname, { body, contentType = 'application/json', allow404 = false } = {}) {
  const response = await fetch(`${api}${pathname}`, {
    method,
    headers: {
      Authorization: `Token ${token}`,
      ...(body !== undefined ? { 'Content-Type': contentType } : {}),
    },
    ...(body !== undefined ? { body: contentType.startsWith('application/json') && typeof body !== 'string' ? JSON.stringify(body) : body } : {}),
  })
  if (allow404 && response.status === 404) return undefined
  const text = await response.text()
  if (!response.ok) throw new Error(`${method} ${pathname} failed with HTTP ${response.status}: ${text.slice(0, 500)}`)
  return text ? JSON.parse(text) : {}
}

const iml = (file) => readFile(path.join(root, file), 'utf8')

async function loadState() {
  try {
    return JSON.parse(await readFile(path.join(root, 'make-app.json'), 'utf8'))
  } catch {
    return {}
  }
}

const state = await loadState()
let appName = state.name

if (!appName || !(await call('GET', `/sdk/apps/${appName}/${VERSION}`, { allow404: true }))) {
  const created = await call('POST', '/sdk/apps', {
    body: {
      name: 'modelflare',
      label: 'Modelflare',
      description: 'Chat, image and video generation with one Modelflare Smart API Key for every model on your account.',
      theme: '#4340FF',
      language: 'en',
      countries: [],
    },
  })
  appName = created.app.name
  await writeFile(path.join(root, 'make-app.json'), `${JSON.stringify({ name: appName, version: VERSION }, null, 2)}\n`)
  console.log(`Created app ${appName}`)
}
const appPath = `/sdk/apps/${appName}/${VERSION}`

await call('PUT', `${appPath}/base`, { body: await iml('base.iml.jsonc'), contentType: 'application/jsonc' })
await call('PUT', `${appPath}/icon`, { body: await readFile(path.join(root, './shared/brand/icon-512.png')), contentType: 'image/png' })
await call('PUT', `${appPath}/readme`, { body: await readFile(path.join(root, 'README.md'), 'utf8'), contentType: 'text/markdown' })

const connections = (await call('GET', `/sdk/apps/${appName}/connections`)).appConnections ?? []
let connection = connections[0]?.name
if (!connection) {
  connection = (await call('POST', `/sdk/apps/${appName}/connections`, { body: { type: 'basic', label: 'Modelflare' } })).appConnection.name
}
await call('PUT', `/sdk/apps/connections/${connection}/api`, { body: await iml('connection/communication.iml.jsonc'), contentType: 'application/jsonc' })
await call('PUT', `/sdk/apps/connections/${connection}/parameters`, { body: await iml('connection/parameters.iml.jsonc'), contentType: 'application/jsonc' })

// The API returns appRpcs although the reference documents rpcs.
const rpcList = await call('GET', `${appPath}/rpcs`)
const rpcs = rpcList.appRpcs ?? rpcList.rpcs ?? []
if (!rpcs.some((rpc) => rpc.name === 'listModels')) {
  await call('POST', `${appPath}/rpcs`, { body: { name: 'listModels', label: 'List models', connection } })
}
await call('PUT', `${appPath}/rpcs/listModels/api`, { body: await iml('rpcs/list-models/communication.iml.jsonc'), contentType: 'application/jsonc' })

const existingModules = new Set(((await call('GET', `${appPath}/modules`)).appModules ?? []).map((module) => module.name))
for (const module of MODULES) {
  if (!existingModules.has(module.name)) {
    await call('POST', `${appPath}/modules`, {
      body: { name: module.name, typeId: ACTION_MODULE, label: module.label, description: module.description, connection },
    })
  }
  const base = `${appPath}/modules/${module.name}`
  await call('PUT', `${base}/api`, { body: await iml(`modules/${module.dir}/communication.iml.jsonc`), contentType: 'application/jsonc' })
  await call('PUT', `${base}/expect`, { body: await iml(`modules/${module.dir}/mappable-params.iml.jsonc`), contentType: 'application/jsonc' })
  await call('PUT', `${base}/interface`, { body: await iml(`modules/${module.dir}/interface.iml.jsonc`), contentType: 'application/jsonc' })
  await call('PUT', `${base}/parameters`, { body: '[]', contentType: 'application/jsonc' })
}

console.log(`Deployed ${appName} v${VERSION}: connection ${connection}, rpc listModels, modules ${MODULES.map((module) => module.name).join(', ')}`)
