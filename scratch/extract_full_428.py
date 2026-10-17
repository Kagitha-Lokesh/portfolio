import json

path = r"C:\Users\kagit\.gemini\antigravity-ide\brain\82bfcf5e-f20a-4ae1-b7e9-c2ea460725e7\.system_generated\logs\transcript_full.jsonl"
with open(path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if data.get("step_index") == 428:
            for tc in data.get("tool_calls", []):
                if tc.get("name") == "write_to_file":
                    code = tc["args"]["CodeContent"]
                    with open("scratch/exact_step428_code.tsx", "w", encoding="utf-8") as out:
                        out.write(code)
                    print(f"Extracted exact step 428 code ({len(code)} bytes) to scratch/exact_step428_code.tsx")
