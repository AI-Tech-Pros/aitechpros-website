# Production vs demo

See the live guide at [orchestrateos.pages.dev/production](https://orchestrateos.pages.dev/production).

## Production (design partners)

1. Onboard → runner key  
2. `pip install resume_engine[remote]`  
3. `RemoteCheckpointStore` → Worker API  
4. Real workflow steps + `resume()` after failure  
5. Clear gates via API or gate explorer  
6. Export `GET /runs/{id}/compliance_export` for compliance  

## Demo (sales & evaluation)

- Landing **gate explorer** (`/#gates`) with seeded runs  
- `/governance` nine-agent **kernel lab** — not production orchestration  
- Optional ingress webhook experiments  

## Rule

If a feature is LLM-only output without a matching API primitive, treat it as **narrative or lab** — not production dependency.
