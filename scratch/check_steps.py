import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r"C:\Users\kagit\.gemini\antigravity-ide\brain\82bfcf5e-f20a-4ae1-b7e9-c2ea460725e7\.system_generated\logs\transcript.jsonl"
with open(path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        idx = data.get("step_index")
        if idx is not None and 619 <= idx <= 687:
            if data.get("type") == "CODE_ACTION" or "tool_calls" in data:
                print(f"=== STEP {idx} ===")
                if "tool_calls" in data:
                    for tc in data["tool_calls"]:
                        print("TOOL:", tc.get("name"))
                        print("ARGS:", str(tc.get("args"))[:300])
                if data.get("content"):
                    print("CONTENT:", data.get("content")[:300])
