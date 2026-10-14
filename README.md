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

`deploy.mjs` creates or updates the app through Make's SDK Apps API and uploads every component above, the icon and this README:

```bash
MAKE_API_TOKEN=... MAKE_ZONE=us2.make.com node deploy.mjs
```

The token needs the `sdk-apps:read` and `sdk-apps:write` scopes. The app name Make assigned on first creation is kept in `make-app.json`, so later runs update the same app. Making the app public (required for the invite link and for Make's review) is a one-way step in Make.

Each model's request fields are on its page at https://docs.modelflare.dev/models/. Gemini image models use `generateContent` and are not covered by the image module.

MIT © Havenbyte LLC
