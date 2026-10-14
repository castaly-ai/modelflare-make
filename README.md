# Modelflare for Make

Make custom app components for Modelflare: chat, image and video generation with one Modelflare **Smart API Key** for every model available to your account.

一个 Modelflare **Smart API Key**，在 Make 场景里调用你账号可用的全部模型。

Get a key / 获取 Key: https://modelflare.dev/sign-up?utm_source=make&utm_medium=plugin&utm_campaign=integrations

## What is here

These files are the source of the Make app's components, in IML JSON:

| Component | Files |
|---|---|
| Base | `base.iml.jsonc` — base URL from the connection, bearer key, `X-Modelflare-Skill` attribution, error message, log sanitizing |
| Connection | `connection/parameters.iml.jsonc`, `connection/communication.iml.jsonc` — Smart API Key and base URL; verified with `GET /models` |
| RPC `listModels` | `rpcs/list-models/communication.iml.jsonc` — model dropdown from the key's model list |
| Module `chat` (action) | `modules/chat/*` — message a text model |
| Module `generateImage` (action) | `modules/generate-image/*` — OpenAI-compatible image models |
| Module `createVideo` / `getVideo` (actions) | `modules/create-video/*`, `modules/get-video/*` — start a video task and check it |

To build the app, create a custom app in Make (or a Make Apps Editor local workspace), add the components with the names above, and paste each file into the matching block (Communication, Mappable parameters, Interface). Publishing the app generates the invite link; request Make's review to list it publicly.

Each model's request fields are on its page at https://docs.modelflare.dev/models/. Gemini image models use `generateContent` and are not covered by the image module.

MIT © Havenbyte LLC
