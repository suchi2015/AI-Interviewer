import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import json

load_dotenv()

client = OpenAI(
    base_url=os.getenv("LLM_BASE_URL"),
    api_key=os.getenv("LLM_API_KEY"),
)
MODEL = os.getenv("LLM_MODEL")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """You are a professional technical interviewer hiring for the role: {role}.
Rules:
- Ask exactly ONE short question at a time.
- Start with an easy question, then increase difficulty based on the candidate's answers.
- Ask a follow-up if an answer is vague.
- Keep each message under 40 words.
- Do not give answers or feedback until the interview ends."""


class Message(BaseModel):
    role: str       # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    role_title: str
    messages: list[Message]


def get_reply(role_title: str, messages: list[dict]) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=300,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT.format(role=role_title)},
            *messages,
        ],
    )
    return response.choices[0].message.content


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat")
def chat(req: ChatRequest):
    reply = get_reply(req.role_title, [m.model_dump() for m in req.messages])
    return {"reply": reply}



FEEDBACK_PROMPT = """You are a senior hiring manager evaluating an interview transcript for the role: {role}.
Return ONLY valid JSON in exactly this format, nothing else:
{{
  "overall_score": <number 1-10>,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "per_question": [
    {{"question": "...", "score": <number 1-10>, "comment": "..."}}
  ],
  "recommendation": "Hire" | "Maybe" | "No hire"
}}
Be fair and specific. Base everything only on the transcript."""


class FeedbackRequest(BaseModel):
    role_title: str
    messages: list[Message]


def get_feedback(role_title: str, messages: list[dict]) -> dict:
    # Transcript ni oka text ga marchi, evaluator ki istam
    transcript = "\n".join(
        f"{'Interviewer' if m['role'] == 'assistant' else 'Candidate'}: {m['content']}"
        for m in messages[1:]  # index 0 = hidden start message
    )
    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=1000,
        temperature=0.3,  # evaluation ki takkuva randomness
        response_format={"type": "json_object"},  # JSON matrame ivvu
        messages=[
            {"role": "system", "content": FEEDBACK_PROMPT.format(role=role_title)},
            {"role": "user", "content": transcript},
        ],
    )
    return json.loads(response.choices[0].message.content)


@app.post("/feedback")
def feedback(req: FeedbackRequest):
    return get_feedback(req.role_title, [m.model_dump() for m in req.messages])