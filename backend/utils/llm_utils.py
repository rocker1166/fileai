from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
from langchain.schema.retriever import BaseRetriever

# Initialize your Gemini-backed chat model
llm = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.2)


def get_qa_chain(retriever: BaseRetriever) -> RetrievalQA:
    """
    Returns a RetrievalQA chain using the Gemini LLM.
    """
    return RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True
    )
