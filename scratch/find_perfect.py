import json

path = r"C:\Users\kagit\.gemini\antigravity-ide\brain\82bfcf5e-f20a-4ae1-b7e9-c2ea460725e7\.system_generated\logs\transcript.jsonl"
with open(path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "perfect_blend_crop" in line or "step428" in line:
            data = json.loads(line)
            idx = data.get("step_index")
            tp = data.get("type")
            source = data.get("source")
            c = str(data.get("content", ""))[:200].replace("\n", " ")
            print(f"Line {i}: step {idx} ({source}, {tp}): {c}")
