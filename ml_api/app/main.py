from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import PredictionInput
from app.model import MLModel
import uvicorn
from fastapi import HTTPException

app = FastAPI(title="ML Price Prediction API")

# Autorise les requêtes CORS pour le frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Charge le modèle au démarrage
ml_model = MLModel()


@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API de prédiction de prix"}


from fastapi import HTTPException


@app.post("/predict")
async def predict(input_data: PredictionInput):
    try:
        # Convertit l'input Pydantic en dict
        input_dict = input_data.dict()

        # Correction du nom de la clé si nécessaire
        if 'Promotion' in input_dict:
            input_dict['Promotion'] = input_dict['Promotion']

        # Fait la prédiction
        prediction = ml_model.predict(input_dict)

        return {"prediction": prediction}

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Erreur lors de la prédiction: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)