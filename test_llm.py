import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    base_url=os.getenv("LLM_BASE_URL"),
    api_key=os.getenv("LLM_API_KEY"),
)

response = client.chat.completions.create(
    model=os.getenv("LLM_MODEL"),
    messages=[
        {"role": "system", "content": "You are a technical interviewer for a Python Backend Developer role. Ask ONE question only."},
        {"role": "user", "content": "I'm ready, please start the interview."},
    ],
    max_tokens=200,
)

print(response.choices[0].message.content)