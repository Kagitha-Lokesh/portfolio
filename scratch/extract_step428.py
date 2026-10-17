import json

path = r"C:\Users\kagit\.gemini\antigravity-ide\brain\82bfcf5e-f20a-4ae1-b7e9-c2ea460725e7\.system_generated\logs\transcript.jsonl"
with open(path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if data.get("step_index") == 428:
            for tc in data.get("tool_calls", []):
                print("TOOL:", tc.get("name"))
                if "CodeContent" in tc.get("args", {}):
                    print("CodeContent length:", len(tc["args"]["CodeContent"]))
                    with open("scratch/step428_clean.tsx", "w", encoding="utf-8") as out:
                        out.write(tc["args"]["CodeContent"])
                    print("Saved step428_clean.tsx successfully!")
