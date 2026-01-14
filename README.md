# 🧠 Multimodal Math Mentor (RAG + Agents + HITL + Memory)

An end-to-end AI application that reliably solves **JEE-style math problems** from **text, image, or audio inputs**, explains solutions step-by-step, verifies correctness, and **improves over time using memory and human feedback**.

**url:** https://clever-num-mentor.lovable.app/
---

## 🚀 Features

* **Multimodal Input**: Text, Image (OCR), and Audio (ASR)
* **Parser Agent**: Converts raw input into structured math problems
* **RAG Pipeline**: Uses a curated math knowledge base (formulas, templates, pitfalls)
* **Multi-Agent System**: Modular agents for solving, verifying, and explaining
* **Human-in-the-Loop (HITL)**: Triggered on low confidence or ambiguity
* **Memory & Self-Learning**: Reuses past solutions and corrections
* **Transparent UI**: Shows agent trace, retrieved context, and confidence
* **Deployed App**: Accessible via public URL

---

## 🧩 Supported Math Scope

* Algebra
* Probability
* Basic Calculus (limits, derivatives, optimization)
* Linear Algebra (basics)

*(JEE-level difficulty, non-olympiad)*

---

## 🏗️ System Architecture

**High-level flow:**

1. Input (Text / Image / Audio)
2. OCR / ASR Processing
3. Parser Agent (structure + ambiguity check)
4. Intent Router Agent
5. RAG Retrieval (Vector DB)
6. Solver Agent (with tools)
7. Verifier / Critic Agent
8. Explainer / Tutor Agent
9. HITL (if required)
10. Memory Storage & Reuse

> Architecture diagram is provided in the repository (`architecture.mmd`).

---

## 🤖 Agents Overview

| Agent           | Responsibility                          |
| --------------- | --------------------------------------- |
| Parser Agent    | Cleans and structures the problem       |
| Intent Router   | Classifies problem type and routes flow |
| Solver Agent    | Solves using RAG + tools (Python)       |
| Verifier Agent  | Checks correctness, domains, edge cases |
| Explainer Agent | Produces step-by-step explanation       |

---

## 📚 RAG Pipeline

* **Knowledge Base**: 10–30 curated math documents
* **Chunking & Embeddings**
* **Vector Store**: FAISS / Chroma
* **Top-k Retrieval**
* **No hallucinated citations** if retrieval fails

Retrieved sources are shown directly in the UI.

---

## 🧠 Memory & Learning

Stored per interaction:

* Original input (text/image/audio)
* Parsed problem
* Retrieved context
* Final solution
* Verifier confidence
* User feedback

Used at runtime to:

* Retrieve similar solved problems
* Reuse solution strategies
* Apply OCR / ASR correction patterns

---

## 🧑‍⚖️ Human-in-the-Loop (HITL)

Triggered when:

* OCR / ASR confidence is low
* Parser detects ambiguity
* Verifier is unsure
* User requests re-check

Human can **edit, approve, or reject** solutions. Corrections are saved as learning signals.

---

## 🖥️ Application UI

Built with **Streamlit**.

Includes:

* Input mode selector (Text / Image / Audio)
* OCR / Transcript preview & edit
* Agent execution trace
* Retrieved context panel
* Final answer & explanation
* Confidence indicator
* Feedback buttons (✅ Correct / ❌ Incorrect)

---

## ⚙️ Tech Stack

* **Frontend**: Streamlit
* **LLM**: OpenAI / compatible LLM
* **OCR**: Tesseract / PaddleOCR
* **ASR**: Whisper
* **Vector DB**: FAISS / Chroma
* **Embeddings**: Sentence Transformers / OpenAI
* **Storage**: Local JSON / SQLite

---

## 🛠️ Setup & Run Locally

```bash
# Clone repository
git clone https://github.com/your-username/multimodal-math-mentor.git
cd multimodal-math-mentor

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Add environment variables
cp .env.example .env

# Run app
streamlit run app.py
```

---

## 🌐 Deployment

Deployed on **Streamlit Cloud / HuggingFace Spaces**.

🔗 **Live App**: *Add deployed link here*

---

## 🎥 Demo Video

3–5 minute demo covering:

* Image → Solution
* Audio → Solution
* HITL workflow
* Memory reuse on similar problem

🔗 *Add video link here*

---

## 📦 Deliverables Checklist

* [x] GitHub Repository
* [x] README
* [x] Architecture Diagram
* [x] Deployed App Link
* [x] Demo Video
* [x] Evaluation Summary

---

## 📄 License

MIT License

---

## 🙌 Acknowledgements

Built as part of **AI Engineer Assignment – AI Planet** to demonstrate reliable, explainable, and adaptive AI systems.
