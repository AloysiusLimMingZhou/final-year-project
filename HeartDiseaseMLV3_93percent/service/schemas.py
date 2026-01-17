from pydantic import BaseModel, conint, confloat

class HeartCase(BaseModel):
    age: conint(ge=18, le=100)
    sex: conint(ge=0, le=1)
    cp: conint(ge=0, le=3)
    trestbps: conint(ge=70, le=250)
    chol: conint(ge=80, le=700)
    fbs: conint(ge=0, le=1)
    restecg: conint(ge=0, le=2)
    thalach: conint(ge=40, le=250)
    exang: conint(ge=0, le=1)
    oldpeak: confloat(ge=0, le=10)
    slope: conint(ge=0, le=2)
    ca: conint(ge=0, le=4)
    thal: conint(ge=0, le=3)
