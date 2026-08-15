# Nova NVIDIA Gateway

The API server exposes a narrow, server-to-server NVIDIA NIM gateway at `POST /api/nvidia/chat`.

## Deployment variables

Set these as sensitive Production variables in the API-server Vercel project:

| Variable | Purpose |
| --- | --- |
| `NVIDIA_API_KEY` | NVIDIA Build API key used only by the API-server runtime. |
| `NOVA_NVIDIA_GATEWAY_TOKEN` | Long random service token shared only with Nova’s server runtime. |

Neither variable is browser-exposed or returned by the API.

## API contract

```http
POST /api/nvidia/chat
Authorization: Bearer <NOVA_NVIDIA_GATEWAY_TOKEN>
Content-Type: application/json

{"prompt":"Summarize this workspace task."}
```

The service accepts one bounded text prompt, uses the allowlisted `nvidia/nemotron-3-nano-30b-a3b` model, disables streaming, caps output to 1,024 tokens, and returns only the completion text, model identifier, and token usage. It rejects unauthenticated, malformed, oversized, or rate-limited requests.

`GET /api/nvidia/health` is safe to call publicly. It reports configuration status without returning any credential.
