# Heart Disease Prediction (FYP)

## Project Overview

This project is a heart disease prediction system that uses machine learning to predict the likelihood of a person developing heart disease based on their medical history and lifestyle factors.

## Project Structure

The project is structured as follows:
1. **Frontend**: Written in Next.js framework for the interface consisting of users, doctors and admin
2. **Backend**: Written in NestJS framework for the backend service and connecting to frontend, database, machine learning and RAG models
3. **Machine Learning Models**: Written in Python for the machine learning models
4. **RAG Models**: Written in Python for the RAG models
5. **Database**: Written in PostgreSQL for the database

## Prerequisites
Ensure you have downloaded the latest version of the following:
- Node.js (v22+)
- NestJS (v11 or higher)
- Python (v3.12 preferrably)
- PostgreSQL (running on port 5432)
- Git 
**Refer to the package.json/package-lock.json files for frontend and backend & requirements.txt for ML and RAG models for the exact versions of the dependencies**

## Installation
# Step 1: Clone the repository
```bash
git clone https://github.com/AloysiusLimMingZhou/final-year-project.git
```

# Step 2: Install dependencies
For each service (backend, frontend, ML model and RAG model), ensure that you have downloaded all the necessary packages/dependencies. Follow the following steps:
1. Backend
```bash
cd fyp-backend
npm install
```
2. Frontend
```bash
cd fyp-frontend
npm install
```
3. ML model
```bash
cd HeartDiseaseMLV3_93percent
python -m venv .venv (To create a python virtual environment if loaded in the beginning)
./.venv/Scripts/activate
pip install -r requirements.txt
```
4. RAG model
```bash
cd RAGFinalYear
python -m venv .venv (To create a python virtual environment if loaded in the beginning)
./.venv/Scripts/activate
pip install -r requirements.txt
```

# Step 3: Set up the database
1. Create a database in postgresql terminal named "finalyearprojectdb"
2. Run the backend with migrations:
```bash
cd fyp-backend
npm install
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

# Step 4: Run the application
1. Run the frontend 
(1st terminal: 
```bash
cd fyp-frontend
npm run dev (The server will run on http://localhost:8080)
```
)
2. Run the backend 
(2nd terminal: 
```bash
cd fyp-backend
npm run start:dev (The server will run on http://localhost:3000)
```
)
3. Run the machine learning models 
(3rd terminal: 
```bash
cd HeartDiseaseMLV3_93percent
./.venv/Scripts/activate (skip this if in virtual environment already)
uvicorn service.api:app --reload --port 8002 (The server will run on http://localhost:8002)
```
)
4. Run the RAG models
(4th terminal: 
```bash
cd RAGFinalYear
./.venv/Scripts/activate (skip this if in virtual environment already)
py generation.py (If you see ImportError: sys.meta_path is None, Python is likely shutting down, dont panic. This is because I didnt add main() inside the file. Thus the flag. It doesnt harm anything and it should run just fine)
py RAGMedicalChatbot.py
uvicorn server:app --reload --port 8001 (The server will run on http://localhost:8001)
```
)

## Debugging Error
# Case 1: If you face any database error, run this command for basic debug
```bash
npx prisma generate
```
This refresh your database schema and hopefully it resolves the crash with a simple restart
**Note**: You cannot run this command while running the backend or it will end up with an error. If you face any error while running this command, it is most likely the backend and please stop the backend first before running this command

# Case 2: Module not Found Error
This error occurs when you have not installed the required dependencies. Run the following command to install the required dependencies
1. Frontend or Backend (in JS)
```bash
cd fyp-backend (or cd fyp-frontend)
npm install
```
2. ML or RAG models (in python)
```bash
cd HeartDiseaseMLV3_93percent (or cd RAGFinalYear)
./.venv/Scripts/activate
pip install -r requirements.txt
```
**Note 1**: Please make sure you have activated the virtual environment before running the command. If it says any error when you do pip install, do ./.venv/Scripts/activate first
**Note 2**: If you face any error while running this command, it is most likely you've run the frontend, backend or ML/RAG server and please stop them first before running this command

# Case 3: Typescript error
This one is simple, whenever you face any type error with the ugly red squiggly line, just do Ctrl + Shift + P and choose 'TypeScript: Restart TS Server' and press enter. Sometimes after some type adjustments you have to restart TS for it to recognize your changes

**If all fails, contact me and let's fix this together! Thanks**