import os
from dotenv import load_dotenv
from langchain_community.vectorstores import Qdrant
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chat_models import init_chat_model
from langchain_core.prompts.prompt import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from sentence_transformers import CrossEncoder

# Initiate env file by the project
load_dotenv()
os.getenv("GOOGLE_API_KEY") # Get the GOOGLE_API_KEY from environment variable
EMBEDDING_MODEL = "BAAI/bge-large-en" # Declare embedding model chosen from database loader
VECTOR_DIR = r"vectorstore" # Vector Database Path
COLLECTION = "Heart_Disease_Collection" # Collection name

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
    search_kwargs={"k":5, "fetch_k":25, "lambda_mult":0.5}
)

MAX_DISTANCE = 0.9
reranker = CrossEncoder("BAAI/bge-reranker-large")

def format_memory(memory):
    lines = []
    for m in memory:
        lines.append(f"{m['role'].capitalize()}: {m['content']}")
    return "\n".join(lines)

def get_llm(): # Initiate LLM model
    model = init_chat_model("google_genai:gemini-2.5-flash")
    return model

def retrieval(): # Retrieve data
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

def format_documents(documents):
    parts = []
    for document in documents:
        source = document.metadata.get("source", "unknown_source")
        page = document.metadata.get("page", "N/A")
        parts.append(f"[Source: {source}, page: {page}]\n{document.page_content}")
    return "\n\n".join(parts)

def build_chain():
    llm = get_llm()

    template = """
    You are an expert in the field of heart disease medical care. Use ONLY the source given in the Context to answer the Question.
    Conversation History is provided to understand follow-up questions, but it DOES NOT replace the Context.
    If you can't find the answer in the Context, just say "I don't know based on these sources."
    Do NOT diagnose, prescribe medications, or give emergency instructions.
    Provide source mentions using the tags already shown in the Context, e.g. [Source: filename].
    
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

    # retrieve_and_format = RunnableParallel(
    #     context=retriever | format_documents,
    #     question=RunnablePassthrough()
    # )
    #
    # chain = (
    #     retrieve_and_format
    #     | prompt
    #     | llm
    #     | StrOutputParser()
    # )
    #
    # return chain

def citation(documents):
    citations = []
    for document in documents:
        source = document.metadata.get("source", "unknown_source")
        page = document.metadata.get("page", None)
        if page is not None:
            citations.append(f"[Source: {source} Page:{page}]")
        else:
            citations.append(f"[Source: {source}]")
    return citations

def answer(question, history_list):
    # Use the history passed from the request, formatted using the helper from memory.py (or we can move helper here)
    # Since we shouldn't use memory.py global state, let's reuse format_memory but pass our list
    history_text = format_memory(history_list)

    doc_with_scores = vector_store.similarity_search_with_score(question, k=5)

    for doc, score in doc_with_scores:
        print(f"Distance: {score:.2f}, Page: {doc.metadata.get('page')}")

    filtered = [doc for doc, score in doc_with_scores if score <= MAX_DISTANCE]

    if not filtered:
        return "I don't know based on these sources.", []

    documents = rerank(question, filtered)
    context = format_documents(documents)
    chain = build_chain()
    ans = chain.invoke({
        "question": question,
        "context": context,
        "history": history_text,
    })

    return ans, citation(documents)