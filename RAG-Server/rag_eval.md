# Grounding test with sample questions from documents to test the RAG model accuracy

1. Q: What is the risk of premature mortality from CVD, cancer, diabetes, or chronic respiratory diseases based on Malaysia Baseline(2010)?
   Expected: 20%
   Citation Page: Clinical_Practice_Guidelines_on_Primary_&_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, Pg 133
   RAG Answer:
   {
    "answer":  "Based on the Malaysia Baseline (2010), the risk of premature mortality from CVD, cancer, diabetes, or chronic respiratory diseases was 20% [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 133].",
    "citation":  [
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:133]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:15]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:29]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:21]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:135]"
                 ]
   }

2. Q: What are the herbal medicines that are used to treat CVD?
   Expected: Plant sources of cardiac glycosides - digitoxin, derived from either D purpurea (foxglove) or Digitalis lanata, and digoxin, derived from D. lanata alone. These have been used for the treatment of heart failure. ...
   Citation Page: Clinical_Practice_Guidelines_on_Primary_&_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, Pg 127
   RAG Answer:
   {
    "answer":  "Some herbal medicines that have been used to treat CVD include: 
    Plant sources of cardiac glycosides: digitoxin (derived from *D purpurea* or *Digitalis lanata*) and digoxin (derived from *D. lanata* alone). These have been used for the treatment of heart failure [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention
_of_Cardiovascular_Disease_2017.pdf, page: 127].\n*   Reserpine from *Rauwolfia serpentina* (snakeroot), *Evodia rutaecarpa* (wu-chu-yu), and *Stephania tetrandra*. These have been
 used in traditional Chinese medicine to treat hypertension [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 1
27].\n*   Garlic and guggulipid. These have been used in Ayurvedic medicine to treat hyperlipidemia [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_
Cardiovascular_Disease_2017.pdf, page: 127].\n*   Extracts of Chinese red yeast rice (*Monascus purpureus*) containing several active ingredients, including monacolin K, can lower 
LDL-C [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 127].\n*   The fruit of the hawthorn (usually *Crataegu
s pinnatifida*; known as shanzha) is widely used for many indications, including lowering cholesterol and blood pressure [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Sec
ondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 127].\n*   The dried root of *S. miltiorrhiza*, known as danshen in TCM, is widely used in China for the treatment of an
gina pectoris, hyperlipidemia, and acute ischemic stroke [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 127]
.\n*   *G. biloba* extract (GBE) has been used for treating cerebral insufficiency and its symptoms of vertigo, tinnitus, memory loss, and mood disorder [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 127].",
    "citation":  [
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:127]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:163]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:17]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:129]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:128]"
                 ]
}


3. Q: What are the Traditional and Complimentary Medicine(T&CM) practices according to the Act 775?
   Expected: Traditional Malay medicine, Traditional Chinese medicine, Traditional Indian medicine, Islamic medical practice, Homeopathy and Complementary therapies
   Citation Page: Clinical_Practice_Guidelines_on_Primary_&_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, Pg 124
   RAG Answer:
   {
    "answer":  "According to Act 775, T\u0026CM practices include [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 124]:\n*   
    Traditional Malay medicine\n*   
    Traditional Chinese medicine\n*   
    Traditional Indian medicine\n*   
    Islamic medical practice\n*   
    Homeopathy\n*   
    Complementary therapies\n\n
    These practices exclude medical and dental practices used by medical and dental practitioners, respectively [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 124].",
    "citation":  [
         "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:124]",
         "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:162]",
         "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:126]",
         "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:177]",
         "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:179]"
     ]
    }


4. Q: What is the recommended dose of Aspirin for patients with a recent non-cardio-embolic ischemic stroke or TIA?
   Expected: 75-325mg daily
   Citation Page: Clinical_Practice_Guidelines_on_Primary_&_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, Pg 107
   RAG Answer:
   {
      "answer":  "For patients with a recent non-cardio-embolic ischemic stroke or TIA, the recommended dose of Aspirin for secondary prevention is 75 â 325 mg daily [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 107].",
       "citation":  [
                        "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:107]",
                        "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:111]",
                        "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:106]",
                        "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:108]",
                        "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:105]"
                    ]
   }


5. Q: What is the category conditions for prediabetes?
   Expected: Impaired fasting glucose (IFG) – FBG: 6.1-6.9 mmol/L, Impaired glucose tolerance (IGT) – 2-hour post load glucose level following oral glucose tolerance test (OGTT) with 75 gm oral glucose between 7.8 – 11.1 mmol/L, Prediabetes – A1c: >5.6 to <6.3%
   Citation Page: Clinical_Practice_Guidelines_on_Primary_&_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, Pg 92
   RAG Answer:
   {
    "answer":  "Prediabetes is a condition where blood glucose levels are higher than normal but below diabetic thresholds. It includes any of the following categories [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 92]:\n*   
    Impaired fasting glucose (IFG) â FBG: 6.1-6.9 mmol/L\n*   
    Impaired glucose tolerance (IGT) â 2-hour post load glucose level following oral glucose tolerance test (OGTT) with 75 gm oral glucose between 7.8 â 11.1 mmol/L\n*   
    Prediabetes â A1c: \u003e5.6 to \u003c6.3%",
    "citation":  [
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:92]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:93]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:94]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:165]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:98]"
                 ]
   }


6. Q: Who is the best player in the NBA right now?
   Expected: I don't know based on these sources, []
   RAG Answer:
   {
       "answer":  "I don\u0027t know based on these sources.",
       "citation":  [
                        "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:137]",
                        "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:159]",
                        "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:140]",
                        "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:165]",
                        "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:99]"
                    ]
   }

7. Q: I have severe fever of 40 degrees Celsius and heart pounding fast, should I take in 20kg of Paracetamol?
   Expected: I don't know based on these sources, []
   RAG Answer:
   {
    "answer":  "I don\u0027t know based on these sources.",
    "citation":  [
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:159]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:154]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:146]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:21]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:162]"
                 ]
    }

8. Q: Who is faster, a duck or a rayquaza?
   Expected: I don't know based on these sources, []
   RAG Answer:
   {
    "answer":  "I don\u0027t know based on these sources.",
    "citation":  [
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:136]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:163]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:149]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:151]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:143]"
                 ]
    }

9. Q: I am feeling dizzy right now? I know theres a herbal medicine that can make me feel better, should I take it?
   Expected: I don't know based on these sources, []
   RAG Answer:
   {                                
    "answer":  "The provided source states that \"the evidence from properly conducted clinical trials is generally insufficient to draw definitive conclusions\" regarding herbal m
edicines [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 127].\n\nWhile G. biloba extract (GBE) \"has been us
ed for treating cerebral insufficiency and its symptoms of vertigo, tinnitus, memory loss, and mood disorder,\" a placebo-controlled study of GBE found no effect on cognitive decli
ne in older adults with normal cognition or with mild cognitive impairment [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 127].\n\nThe source does not provide information or recommendations on whether you should take herbal medicine for dizziness.",
    "citation":  [
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:127]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:163]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:163]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:162]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:162]"
                 ]
    }

10. Q: I have allergy in paracetamol, and Im having joint pain, I want to eat it, can I?
    Expected: I don't know based on these sources, []
    RAG Answer:
    {
    "answer":  "I don\u0027t know based on these sources.",
    "citation":  [
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:149]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:151]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:163]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:150]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:137]"
                 ]
    }

# Conversation Model Performance:
Q: What is the recommended dose of Aspirin for patients with a recent non-cardio-embolic ischemic stroke or TIA?
Expected: 75-325mg daily
Citation: Clinical_Practice_Guidelines_on_Primary_&_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Pg 107
RAG Ans:
{
    "answer":  "For patients with a recent non-cardio-embolic ischemic stroke or TIA, the recommended dose of Aspirin is 75 â 325 mg daily [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 107].",
    "citation":  [
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:107]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:111]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:106]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:108]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:105]"
                 ]
}

(Cont.) Q: How about patient with less than 1 year after an ACS who have undergone PCI (with either bare metal or drug eluting stent)?
Expected: In patients <1 year after an ACS who have undergone PCI (with either bare metal or drug eluting stent), the recommendation is DAPT for 1 year with: Low-dose aspirin 75-100 mg + clopidogrel 75 mg daily.570,573,574, Low-dose aspirin 75-100 mg + ticagrelor 90 mg BD.573,575,576, Low-dose aspirin 75-100 mg + prasugrel 10 mg daily.573,577 Prasugrel is not recommended in patients with a body weight of <60 kg, age >75 years, or with a previous stroke/TIA.57
Citation: Clinical_Practice_Guidelines_on_Primary_&_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Pg 106
RAG Ans:
{
    "answer":  "For patients less than 1 year after an ACS who have undergone PCI (with either a bare metal or drug-eluting stent), the recommendation is dual antiplatelet therapy 
(DAPT) for 1 year with low-dose aspirin 75-100 mg daily, in combination with either clopidogrel 75 mg daily, ticagrelor 90 mg BD, or prasugrel 10 mg daily [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 106, 108].",
    "citation":  [
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:106]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:108]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:107]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:160]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:148]"
                 ]
}

# Example 2 of conversation memory to test the RAG Model Performance:
Q: "What is the recommended dose of Aspirin for patients with a recent non-cardio-embolic ischemic stroke?"
History: 
1. { "role": "user", "content": "What is cardiovascular disease?" }, 
2. { "role": "assistant", "content": "Cardiovascular disease (CVD) refers to a group of disorders of the heart and blood vessels." }, 
3. { "role": "user", "content": "What are the main risk factors?" }, 
4. { "role": "assistant", "content": "Common risk factors include hypertension, diabetes, smoking, obesity, and physical inactivity." }

Expected: 75-325mg daily
Citations: Clinical_Practice_Guidelines_on_Primary_&_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, Pg 107
RAG Ans:
{
    "answer":  "For patients with a recent non-cardio-embolic ischemic stroke, the recommended dose of Aspirin for secondary prevention is 75 â 325 mg daily [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 107].",
    "citation":  [
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:107]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:111]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:106]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:105]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:161]"
                 ]
}

(.venv) PS C:\Users\aloys\PycharmProjects\RAGFinalYear> Invoke-RestMethod `
>>   -Uri "http://127.0.0.1:8000/chat" `
>>   -Method POST `
>>   -Headers @{ "Content-Type" = "application/json" } `
>>   -Body '{
>>     "question": "What is the recommended dose of Aspirin for patients with a recent non-cardio-embolic ischemic stroke?",
>>     "history": [
>>       { "role": "user", "content": "What is cardiovascular disease?" },
>>       { "role": "assistant", "content": "Cardiovascular disease (CVD) refers to a group of disorders of the heart and blood vessels." },
>>       { "role": "user", "content": "What are the main risk factors?" },
>>       { "role": "assistant", "content": "Common risk factors include hypertension, diabetes, smoking, obesity, and physical inactivity." }
>>     ]
>>   }' | ConvertTo-Json -Depth 5
{
    "answer":  "For patients with a recent non-cardio-embolic ischemic stroke, the recommended dose of Aspirin for secondary prevention is 75 â 325 mg daily [Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf, page: 107].",
    "citation":  [
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:107]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:111]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:106]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:105]",
                     "[Source: Clinical_Practice_Guidelines_on_Primary_\u0026_Secondary_Prevention_of_Cardiovascular_Disease_2017.pdf Page:161]"
                 ]
}

# Run uvicorn server:app --reload --port 8001 to start the server