from flask import Flask, request, jsonify
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from dotenv import load_dotenv
import os
from flask_cors import CORS

# -------------------- Setup --------------------
app = Flask(__name__)
CORS(app)


# Load environment variables
load_dotenv()
llm_api_key = "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"

# Load PDF
loader = PyPDFLoader("data/Coforge_WebApplication_First.pdf")
data = loader.load()

# Split text
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500)
docs = text_splitter.split_documents(data)

# Embeddings & Vector Store
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Chroma.from_documents(documents=docs, embedding=embeddings)
retriever = vectorstore.as_retriever(search_type="similarity")

# LLM
llm = ChatGroq(
    groq_api_key=llm_api_key,
    model_name="llama-3.1-8b-instant",
    temperature=0.5
)

# Prompt
system_prompt = (
    "You are an assistant for question-answering tasks. "
    "Use the following pieces of retrieved context to answer "
    "the question. If you don't know the answer, say that you "
    "don't know. Use three sentences maximum and keep the "
    "answer concise.\n\n{context}"
)
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])

# Create chains
question_answer_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, question_answer_chain)


# -------------------- API Endpoint --------------------
@app.route("/ask", methods=["POST"])
def ask():
    try:
        data = request.get_json()
        user_query = data.get("question", "")

        if not user_query:
            return jsonify({"error": "Please provide a question"}), 400

        response = rag_chain.invoke({"input": user_query})
        print(response['answer'])
        return jsonify({"answer": response["answer"]})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# import requests
# from apscheduler.schedulers.background import BackgroundScheduler
# # Dummy route
# @app.route('/keep_alive', methods=['GET'])
# def keep_alive():
#     return "Instance is alive!", 200

# # Function to send dummy request
# def send_dummy_request():
#     try:
#         # Replace 'http://your-domain.com/keep_alive' with your deployed API URL
#         response = requests.get('https://medisense-backend.onrender.com/keep_alive')
#         print(f"Keep-alive request sent: {response.status_code}")
#     except Exception as e:
#         print(f"Failed to send keep-alive request: {e}")

# # Scheduler to run the dummy request every 10 minutes
# scheduler = BackgroundScheduler()
# scheduler.add_job(send_dummy_request, 'interval', minutes=1)
# scheduler.start()


# -------------------- Run Server --------------------
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))  # Use Render's port
    app.run(host="0.0.0.0", port=port, debug=True)
