# `resume_engine` examples

| Script | Purpose |
|--------|---------|
| [`partner_plain_python.py`](partner_plain_python.py) | Design partner starter — remote store, partial failure, compensation, resume |
| [`partner_langgraph.py`](partner_langgraph.py) | LangGraph pilot — start_run + remote store wiring |
| [`partner_crewai.py`](partner_crewai.py) | CrewAI pilot — start_run + remote store wiring |
| [`../demo_remote_pipeline.py`](../demo_remote_pipeline.py) | Transient failure demo → gate explorer |
| [`../demo_restart_vs_resume.py`](../demo_restart_vs_resume.py) | Local SQLite — restart vs resume comparison |

**Docs:** [Design partner cookbook](../../docs/orchestrateos/cookbook-design-partner.md)

```powershell
pip install "resume_engine[remote]"
$env:ORCHESTRATEOS_API_KEY = "<runner-key>"
python resume_engine/examples/partner_plain_python.py
```
