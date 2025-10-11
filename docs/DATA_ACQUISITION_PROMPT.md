# Data Acquisition & Placement — Persian Chat + STT/TTS (Strict, Real, Verifiable)

**Objective**
Download the following **real** Persian datasets/models, preprocess where required, and place them in the **exact directory layout** below. Produce **checksums, counts, and logs**. If any acceptance check fails, stop and fix.

## Target Layout (must match)

```
/datasets/
  text/
    persian_conversation/            # Persian conversational text (HF)
      data/...
      README.source.md
    # (optional) other text corpora…
  speech/
    commonvoice_fa/                   # Persian ASR (Common Voice fa)
      data/...
      README.source.md
    fleurs_fa/                        # Multilingual speech set incl. fa
      data/...
      README.source.md
  tts/
    kamtera_vits_female/              # TTS model assets
      model/...
      README.source.md
    kamtera_vits_male/
      model/...
      README.source.md
checksums/
  datasets.sha256.txt
logs/
  dataset_sources.json
  dataset_download.log
```

---

## Sources (download & provenance)

### A) Persian Text (conversation)

* **Kamtera/Persian-conversational-dataset** (HF) — ~845 MB conversational Persian corpus.
  Link: [Hugging Face](https://huggingface.co/datasets/Kamtera/Persian-conversational-dataset)

### B) Persian Speech (ASR / STT)

* **hezarai/common-voice-13-fa** (HF) — Persian split of Common Voice v13 (≈48,904 rows).
  Link: [Hugging Face](https://huggingface.co/datasets/hezarai/common-voice-13-fa)
* **google/fleurs** (HF) — multilingual speech; include **fa** subsets for speech tasks.
  Link: [Hugging Face](https://huggingface.co/datasets/google/fleurs)

### C) Persian TTS (models)

* **Kamtera/persian-tts-female-vits** (HF) — single-speaker female VITS model.
  Link: [Hugging Face](https://huggingface.co/Kamtera/persian-tts-female-vits)
* **Kamtera/persian-tts-male-vits** (HF) — male VITS model.
  Link: [Hugging Face](https://huggingface.co/Kamtera/persian-tts-male-vits)

> Notes:
> • Some HF pages require `git-lfs`/`huggingface-cli`.
> • Common Voice may also be mirrored on Kaggle; prefer HF split above for automation. [Kaggle](https://www.kaggle.com/datasets/amirftma/common-voice-fa-v13)

---

## Exact Commands (Linux, no placeholders)

> Use **one** of the two supported methods per source. Prefer `huggingface-cli snapshot-download` for reproducibility.

### 1) Prepare tools

```bash
# in repo root
mkdir -p datasets/text/persian_conversation datasets/speech/commonvoice_fa datasets/speech/fleurs_fa datasets/tts/{kamtera_vits_female,kamtera_vits_male} checksums logs

pip install -U "huggingface_hub[cli]" datasets soundfile jiwer > logs/dataset_download.log 2>&1 || true
git lfs install
```

### 2) Download Persian conversation (text)

```bash
# Method A: snapshot-download
huggingface-cli snapshot-download \
  --repo-type dataset \
  Kamtera/Persian-conversational-dataset \
  --local-dir datasets/text/persian_conversation/data \
  --local-dir-use-symlinks False \
  >> logs/dataset_download.log 2>&1
```

Write provenance:

```bash
cat > datasets/text/persian_conversation/README.source.md << 'EOF'
Source: Kamtera/Persian-conversational-dataset (Hugging Face)
URL: https://huggingface.co/datasets/Kamtera/Persian-conversational-dataset
License: apache-2.0 (see dataset card)
EOF
```

### 3) Download ASR datasets (speech)

**Common Voice fa (HF mirror)**

```bash
huggingface-cli snapshot-download \
  --repo-type dataset \
  hezarai/common-voice-13-fa \
  --local-dir datasets/speech/commonvoice_fa/data \
  --local-dir-use-symlinks False \
  >> logs/dataset_download.log 2>&1
```

**FLEURS (speech, include fa subsets)**

```bash
huggingface-cli snapshot-download \
  --repo-type dataset \
  google/fleurs \
  --local-dir datasets/speech/fleurs_fa/data \
  --local-dir-use-symlinks False \
  >> logs/dataset_download.log 2>&1
```

Add provenance notes:

```bash
cat > datasets/speech/commonvoice_fa/README.source.md << 'EOF'
Source: hezarai/common-voice-13-fa (Hugging Face mirror of Common Voice 13 Persian)
URL: https://huggingface.co/datasets/hezarai/common-voice-13-fa
EOF

cat > datasets/speech/fleurs_fa/README.source.md << 'EOF'
Source: google/fleurs (Hugging Face)
URL: https://huggingface.co/datasets/google/fleurs
Note: Use fa language splits for ASR/S2S experiments as applicable.
EOF
```

### 4) Download TTS models (VITS)

```bash
# Female VITS
huggingface-cli snapshot-download \
  --repo-type model \
  Kamtera/persian-tts-female-vits \
  --local-dir datasets/tts/kamtera_vits_female/model \
  --local-dir-use-symlinks False \
  >> logs/dataset_download.log 2>&1

# Male VITS
huggingface-cli snapshot-download \
  --repo-type model \
  Kamtera/persian-tts-male-vits \
  --local-dir datasets/tts/kamtera_vits_male/model \
  --local-dir-use-symlinks False \
  >> logs/dataset_download.log 2>&1
```

Add provenance:

```bash
cat > datasets/tts/kamtera_vits_female/README.source.md << 'EOF'
Source: Kamtera/persian-tts-female-vits (Hugging Face)
URL: https://huggingface.co/Kamtera/persian-tts-female-vits
EOF

cat > datasets/tts/kamtera_vits_male/README.source.md << 'EOF'
Source: Kamtera/persian-tts-male-vits (Hugging Face)
URL: https://huggingface.co/Kamtera/persian-tts-male-vits
EOF
```

---

## Post-download sanity checks (must pass)

```bash
# 1) Basic counts: list number of files (non-empty) per bucket
find datasets/text/persian_conversation/data -type f -size +1c | wc -l
find datasets/speech/commonvoice_fa/data -type f -size +1c | wc -l
find datasets/speech/fleurs_fa/data -type f -size +1c | wc -l
find datasets/tts/kamtera_vits_female/model -type f -size +1c | wc -l
find datasets/tts/kamtera_vits_male/model -type f -size +1c | wc -l

# 2) Compute SHA256 for reproducibility
rm -f checksums/datasets.sha256.txt
find datasets -type f -size +1c -print0 | sort -z | xargs -0 sha256sum > checksums/datasets.sha256.txt

# 3) Record machine-readable provenance
python - << 'PY'
import os, json, hashlib
from pathlib import Path
base = Path("datasets")
def count(p): return sum(1 for _ in p.rglob("*") if _.is_file() and _.stat().st_size>0)
meta = {
  "text_persian_conversation_files": count(base/"text/persian_conversation/data"),
  "speech_commonvoice_fa_files": count(base/"speech/commonvoice_fa/data"),
  "speech_fleurs_fa_files": count(base/"speech/fleurs_fa/data"),
  "tts_female_files": count(base/"tts/kamtera_vits_female/model"),
  "tts_male_files": count(base/"tts/kamtera_vits_male/model"),
}
Path("logs").mkdir(exist_ok=True, parents=True)
(Path("logs")/"dataset_sources.json").write_text(json.dumps(meta, indent=2), "utf-8")
print(json.dumps(meta, indent=2))
PY
```

**Acceptance (hard gates)**

* All five buckets exist and contain **non-empty** files.
* `checksums/datasets.sha256.txt` exists and is non-empty.
* `logs/dataset_sources.json` contains **non-zero** counts for each bucket.
* Each `README.source.md` exists with the exact URL.

---

## Normalization (minimal, safe defaults)

* For **text**, keep raw files but also produce unified JSONL in `datasets/text/persian_conversation/combined.jsonl` if the dataset includes JSON shards:

  * schema for chat fine-tuning:
    `{"messages":[{"role":"system","content":"…"},{"role":"user","content":"…"},{"role":"assistant","content":"…"}]}`
* For **speech**, don't alter audio; just ensure paths and metadata are preserved for STT/TTS scripts.

**Command (optional JSONL builder if sources contain dialogues):**

```bash
python - << 'PY'
import json, pathlib
root = pathlib.Path("datasets/text/persian_conversation/data")
out = pathlib.Path("datasets/text/persian_conversation/combined.jsonl")
count=0
with out.open("w",encoding="utf-8") as w:
    for p in root.rglob("*.json"):
        try:
            obj=json.loads(p.read_text(encoding="utf-8"))
            # naive pass-through; adapt if dataset structure differs
            if isinstance(obj, dict) and "messages" in obj:
                w.write(json.dumps(obj, ensure_ascii=False)+"\n")
                count+=1
        except Exception:
            pass
print("written", count)
PY
```

---

## Where each bucket is used (wire-up)

* **Text** → fine-tune/chat training scripts (`scripts/train_cpu.ts`) as primary conversational corpus.
* **Common Voice fa** → STT training/eval or adaptation.
* **FLEURS fa** → auxiliary speech experiments / language ID / ASR few-shot.
* **TTS VITS (female/male)** → `/api/tts` synthesis backends or local inference demos.

---

## Reporting

* Append a **summary block** at the end of `logs/dataset_download.log` showing:

  * file counts from `logs/dataset_sources.json`
  * last modified timestamps of bucket roots
  * head/tail of `checksums/datasets.sha256.txt`

---

If any step fails or any acceptance check is empty/zero, **do not mark complete** and fix immediately.

**Citations:** Persian conversational dataset, Common Voice fa (HF split), FLEURS dataset, and Persian VITS models are documented on Hugging Face.
