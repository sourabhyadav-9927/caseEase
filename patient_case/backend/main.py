from fastapi import FastAPI
from google import genai
from google.genai.errors import ClientError, ServerError
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import time
from dotenv import load_dotenv

# Reads backend/.env if it exists (local use). On Render this does nothing.
load_dotenv()

app = FastAPI()

# Comma-separated list of allowed frontend URLs, set on the host (Render).
# Example: https://my-app.vercel.app  (defaults to "*" for local testing)
ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()
]

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is not set")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

client = genai.Client(api_key=GEMINI_API_KEY)

@app.get("/")
def health():
    return {"status": "ok"}


class PatientInfo(BaseModel):
    name: str
    age: int
    gender: str
    chief_complaint: str
    past_conversation: Optional[list[str]]= None
    message: Optional[str] = None

@app.post("/case/chat")
def patientCase(patient_info: PatientInfo):
    name = patient_info.name
    age = patient_info.age
    gender = patient_info.gender
    patient_conversation = patient_info.chief_complaint
    past_conversation = patient_info.past_conversation
    message = patient_info.message

    prompt = f"""
You are an AI case-taking assistant for a doctor.

Your job is to collect only the information necessary to understand
the patient's chief complaint.

RULES:

1. Ask only ONE question at a time.
2. Ask questions related to the patient's chief complaint.
3. Do not give treatment, diagnosis, medication, or medical advice.
4. Do not repeat information that the patient has already provided.
5. Stop asking questions when you have enough information to create
   a useful clinical case summary.
6. Do not ask unnecessary questions just to collect more information.
7. When sufficient information has been collected, DO NOT ask another
   question.
8. Instead, return a final case summary.
9. The final response must clearly indicate that questioning is complete.
10. Keep the summary concise and organized for a doctor.

Information to collect when relevant:
- Chief complaint
- Duration
- Onset
- Location
- Severity
- Nature/character of symptoms
- Associated symptoms
- Aggravating/relieving factors
- Relevant medical history
- Relevant medication/allergy information

Only collect information that is relevant to the patient's complaint.

When enough information has been collected, return:

STATUS: COMPLETE

SUMMARY:
[concise case summary]

Do not ask another question after STATUS: COMPLETE.


Patient Information:
Name: {name}
Age: {age}
Gender: {gender}

Chief Complaint:
{patient_conversation} 

past Conversation:
{past_conversation}

Latest Patient Message:
{message}


"""

    for attempt in range(3):

        try:

            print(f"Gemini request attempt {attempt + 1}")

            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt
            )

            return {
                "response": response.text
            }

        except ClientError as e:
            print("Gemini client error:", e)
            if getattr(e, "code", None) == 429:
                return {
                    "response": "The AI service has reached its free usage limit. Please try again in a minute."
                }
            raise

        except ServerError as e:

            print("Gemini 503 error:")
            print(e)

            # If this was the final attempt, stop
            if attempt == 2:
                return {
                    "response": "The AI service is temporarily busy. Please try again in a few seconds."
                }

            # Exponential backoff
            wait_time = 2 ** attempt

            print(f"Retrying in {wait_time} seconds...")

            time.sleep(wait_time)
