from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from generation import answer
import uvicorn

class Message(BaseModel):
    role: str
    content: str

class QuestionRequest(BaseModel):
    question: str
    history: List[Message] = []

class AnswerResponse(BaseModel):
    answer: str
    citation: list[str]

app = FastAPI()

@app.post("/chat")
async def chat(request: QuestionRequest):
    history_dicts = [{"role": m.role, "content": m.content} for m in request.history]
    ans, citation = answer(request.question, history_dicts)
    return AnswerResponse(answer=ans, citation=citation)

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8001, reload=True)