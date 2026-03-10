import os
import re
from dotenv import load_dotenv
from langchain_community.vectorstores import Qdrant
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chat_models import init_chat_model
from langchain_core.prompts.prompt import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from sentence_transformers import CrossEncoder

# Initiate env file by the project
load_dotenv()
os.getenv("GOOGLE_API_KEY")

EMBEDDING_MODEL = "BAAI/bge-large-en"
VECTOR_DIR = r"vectorstore"
COLLECTION = "Heart_Disease_Collection"

embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL,
    encode_kwargs={"normalize_embeddings": True},
)

vector_store = Qdrant.from_existing_collection(
    embedding=embeddings,
    path=VECTOR_DIR,
    collection_name=COLLECTION,
)

RETRIEVER = vector_store.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 5, "fetch_k": 25, "lambda_mult": 0.5}
)

MAX_DISTANCE = 0.9
reranker = CrossEncoder("BAAI/bge-reranker-large")


def format_memory(memory):
    lines = []
    for m in memory:
        lines.append(f"{m['role'].capitalize()}: {m['content']}")
    return "\n".join(lines)


def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s?]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text


def is_identity_question(question: str) -> bool:
    q = normalize_text(question)

    identity_patterns = [
        "who are you",
        "what is your name",
        "whats your name",
        "your name",
        "what do you do",
        "what can you do",
        "what is your purpose",
        "why are you called miku",
        "why are you called miku assistant",
        "what is healthconnect",
        "tell me about healthconnect",
        "are you a doctor",
        "can you diagnose me",
        "can you diagnose",
        "can you give medical advice",
        "hello",
        "hi",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
    ]

    return any(pattern in q for pattern in identity_patterns)


def direct_identity_answer(question: str):
    q = normalize_text(question)

    rules = [
        (
            ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"],
            "Hello! I'm Miku, your cheerful virtual idol assistant in HealthConnect. I'm here to help explain heart-health information and guide you through the system."
        ),
        (
            ["who are you", "what are you"],
            "I'm Miku, a virtual idol and assistant inside HealthConnect. I'm here to help explain heart-health information and guide you through the system."
        ),
        (
            ["what is your name", "whats your name", "your name"],
            "My name is Miku Assistant, but you can call me Miku!"
        ),
        (
            ["what do you do", "what can you do", "what is your purpose"],
            "I help explain heart-health information, screening terms, and HealthConnect features in a clear and friendly way using trusted sources in the system."
        ),
        (
            ["are you a doctor"],
            "Nope — I'm not a doctor. I'm Miku, your virtual assistant in HealthConnect, and I explain information from trusted sources in the system."
        ),
        (
            ["can you diagnose me", "can you diagnose"],
            "I can't diagnose you, but I can help explain the information in HealthConnect and make medical terms easier to understand."
        ),
        (
            ["can you give medical advice"],
            "I can explain trusted information in HealthConnect, but I don't replace professional medical advice."
        ),
        (
            ["why are you called miku", "why are you called miku assistant"],
            "Because in the Sakura theme of HealthConnect, I take the role of Miku — a cheerful virtual idol assistant who helps guide users through the system."
        ),
        (
            ["what is healthconnect", "tell me about healthconnect"],
            "HealthConnect is a heart disease prediction and well-being system that combines screening, educational content, and assistant support using trusted health information sources."
        ),
    ]

    for patterns, answer in rules:
        for pattern in patterns:
            if pattern in q:
                return answer

    return None


def get_llm():
    model = init_chat_model("google_genai:gemini-2.5-flash")
    return model


def retrieval():
    return RETRIEVER


def rerank(question, documents, top_n=5):
    pairs = [(question, d.page_content) for d in documents]
    scores = reranker.predict(pairs)

    ranked = sorted(
        zip(documents, scores),
        key=lambda pair: pair[1],
        reverse=True
    )

    return [doc for doc, _ in ranked[:top_n]]


def deduplicate_documents(documents):
    unique_docs = []
    seen = set()

    for doc in documents:
        # use a short normalized preview to avoid near-duplicate chunks
        preview = normalize_text(doc.page_content[:200])
        if preview not in seen:
            seen.add(preview)
            unique_docs.append(doc)

    return unique_docs


def format_documents(documents):
    parts = []
    for document in documents:
        # do NOT inject [Source: ...] into the prompt context
        # because the model may copy it awkwardly into the answer
        parts.append(document.page_content)
    return "\n\n".join(parts)


def build_chain():
    llm = get_llm()

    template = """
You are Miku, a cheerful virtual idol assistant inside HealthConnect.

Behavior rules:
- Be friendly, cheerful, supportive, and clear.
- For medical or heart-health questions, use ONLY the information given in the Context.
- Conversation History helps with follow-up questions, but it does NOT replace the Context.
- If the answer is not found in the Context, say exactly: "I don't know based on these sources."
- Do NOT diagnose, prescribe medications, or give emergency instructions.
- Do NOT repeat the same idea multiple times.
- Keep identity or greeting answers short and natural.
- For screening term questions, explain in plain language first.
- Do not include raw source tags like [Source: ...] in the answer body.

Conversation History:
{history}

Question:
{question}

Context:
{context}

Answer:
"""
    prompt = PromptTemplate.from_template(template)
    return prompt | llm | StrOutputParser()


def citation(documents):
    citations = []
    seen = set()

    for document in documents:
        source = document.metadata.get("source", "unknown_source")
        page = document.metadata.get("page", None)

        if page is not None:
            cite = f"[Source: {source} Page:{page}]"
        else:
            cite = f"[Source: {source}]"

        if cite not in seen:
            seen.add(cite)
            citations.append(cite)

    return citations


def answer(question, history_list):
    history_text = format_memory(history_list)

    # 1. Direct fallback for identity / greeting / role questions
    direct_answer = direct_identity_answer(question)
    if direct_answer:
        return direct_answer, []

    # 2. Use smaller retrieval for identity-like questions, normal retrieval for others
    k = 2 if is_identity_question(question) else 5
    top_n = 1 if is_identity_question(question) else 5

    doc_with_scores = vector_store.similarity_search_with_score(question, k=k)

    for doc, score in doc_with_scores:
        print(f"Distance: {score:.2f}, Page: {doc.metadata.get('page')}")

    filtered = [doc for doc, score in doc_with_scores if score <= MAX_DISTANCE]

    if not filtered:
        return "I don't know based on these sources.", []

    documents = rerank(question, filtered, top_n=top_n)
    documents = deduplicate_documents(documents)

    context = format_documents(documents)
    chain = build_chain()

    ans = chain.invoke({
        "question": question,
        "context": context,
        "history": history_text,
    })

    return ans, citation(documents)