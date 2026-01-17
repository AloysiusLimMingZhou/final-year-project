import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Qdrant
from transformers import AutoTokenizer
import glob

DATA_DIR = r"data"
VECTOR_DB_DIR = r"vectorstore"
EMBEDDING_MODEL = "BAAI/bge-large-en"
COLLECTION = "Heart_Disease_Collection"

tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL)

def load_pdfs(data_dir):
    documents = [] # We create a document array to store all the words for each page for each document
    paths = glob.glob(os.path.join(data_dir, "*.pdf")) # This combines multiple pdfs into 1 array. Exp ["A.pdf", "B.pdf", "C.pdf"]
    if not paths:
        print("No PDF files found")
        return documents

    for path in paths: # Loop through each pdf path
        print(f"Processing {path}")
        loader = PyPDFLoader(path) # We pass the pdf into langchain PyPDFLoader, and it will automatically digest the pdf content
        pages = loader.load() # PyPDFLoader split the pdf into pages
        for page in pages: # Loop through each page
            # The PyPDFLoader will create a metadata object for each page which consists of the following attributes:
            # source
            # page
            # total_page
            # creationdate
            # creator
            # producer
            # Instead of putting absolute file path like "C:\Users\aloys\PycharmProjects\RAGFinalYear\data\A.pdf, we use os basename function to shorten it to relative path like A.pdf
            page.metadata["source"] =os.path.basename(path)
        documents.extend(pages) # Instead of using append which stuff all pages into the document, we split the pdf into pages and extend it to the document by elements
        # For exp:
        # documents.append(pages) = [page1content \n page2content \n page3content] 1 element of n pages
        # documents.extend(pages) = [page1content, page2content, page3content,...] n elements of n pages
    return documents

def token_length(text):
    tokens = tokenizer.encode(text, add_special_tokens=False)
    return len(tokens)

def text_splitters(documents): # Since our documents are very large, maybe up to hundred thousands of token which exceeds most model limit, thus we need to split them into chunks and the model will access them via vector database
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=512, # Store every 512 tokens of a pdf into a single chunk
        chunk_overlap=100, # 100 token overlap with previous chunk
        length_function=token_length
    )
    chunks = text_splitter.split_documents(documents) # Split the document into chunks
    return chunks

def main():
    documents = load_pdfs(DATA_DIR) # Load the documents
    if not documents:
        print("No PDF files found! Aborting...")
        return
    chunks = text_splitters(documents) # Split the documents into chunks
    embeddings = HuggingFaceEmbeddings( # Setting up the embedding model to turn chunks from words into matrices that LLMs can understand
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device":"cuda"},
        encode_kwargs={"normalize_embeddings": True},
    )

    vectorstore = Qdrant.from_documents(
        # Creating our local vector database. We choose QDrant from langchain community vectorstores
        # The reason we choose vector database than traditional database is because
        # Vector database show relationship between data like distances
        # The closer the chunks of data with each other, the more related they are, which allows our LLM to make use of the relationship and generate truthful and relevant output
        documents= chunks,
        embedding= embeddings,
        path=VECTOR_DB_DIR,
        collection_name=COLLECTION,
    )

    print(f"Split {len(documents)} documents into {len(chunks)} chunks")

if __name__ == "__main__":
    main()