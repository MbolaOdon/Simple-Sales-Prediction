import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MLModel:
    def __init__(self, model_path='model.pkl', scaler_path='scaler.pkl'):
        """
        Initialise le modèle ML avec chargement automatique des fichiers
        """
        try:
            # Chargement du modèle et du scaler
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)

            # Récupération des features du modèle entraîné
            if hasattr(self.model, 'feature_names_in_'):
                self.expected_features = list(self.model.feature_names_in_)
                logger.info(f"Features attendues par le modèle: {self.expected_features}")
            else:
                # Fallback vers une liste manuelle si feature_names_in_ n'existe pas
                self.expected_features = [
                    'Inventory Level', 'Units Sold', 'Units Ordered', 'Discount', 'Promotion',
                    'Competitor Pricing', 'Epidemic', 'Category_Electronics',
                    'Category_Furniture', 'Category_Groceries', 'Category_Toys', 'Region_North',
                    'Region_South', 'Region_West', 'Weather Condition_Rainy',
                    'Weather Condition_Snowy', 'Weather Condition_Sunny', 'Seasonality_Spring',
                    'Seasonality_Summer', 'Seasonality_Winter', 'Sales_Rate',
                    'Order_Fulfillment_Rate', 'Promo_Discount_Interaction'
                ]
                logger.warning("Utilisation de la liste de features par défaut")

            # Identification des colonnes numériques à standardiser
            self.numeric_features = [
                'Inventory Level', 'Units Sold', 'Units Ordered', 'Discount',
                'Competitor Pricing', 'Sales_Rate', 'Order_Fulfillment_Rate'
            ]

            # Mappings pour l'encodage des variables catégorielles
            self.setup_categorical_mappings()

            logger.info("Modèle chargé avec succès")

        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle: {str(e)}")
            raise

    def setup_categorical_mappings(self):
        """Configure les mappings pour les variables catégorielles"""

        # Mapping pour les catégories
        self.category_mapping = {
            'Electronics': 'Category_Electronics',
            'Furniture': 'Category_Furniture',
            'Groceries': 'Category_Groceries',
            'Toys': 'Category_Toys'
        }

        # Mapping pour les régions
        self.region_mapping = {
            'North': 'Region_North',
            'South': 'Region_South',
            'West': 'Region_West'
        }

        # Mapping pour les conditions météorologiques
        self.weather_mapping = {
            'Rainy': 'Weather Condition_Rainy',
            'Snowy': 'Weather Condition_Snowy',
            'Sunny': 'Weather Condition_Sunny'
        }

        # Mapping pour la saisonnalité
        self.seasonality_mapping = {
            'Spring': 'Seasonality_Spring',
            'Summer': 'Seasonality_Summer',
            'Winter': 'Seasonality_Winter'
        }

    def validate_input(self, input_data: dict):
        """Valide les données d'entrée"""

        # Vérification des champs obligatoires
        required_fields = [
            'Inventory_Level', 'Units_Sold', 'Units_Ordered', 'Discount',
            'Competitor_Pricing', 'Category', 'Region', 'Weather_Condition', 'Seasonality'
        ]

        missing_fields = [field for field in required_fields if field not in input_data]
        if missing_fields:
            raise ValueError(f"Champs manquants: {missing_fields}")

        # Validation des types numériques
        numeric_fields = [
            'Inventory_Level', 'Units_Sold', 'Units_Ordered', 'Discount', 'Competitor_Pricing'
        ]

        for field in numeric_fields:
            try:
                float(input_data[field])
            except (ValueError, TypeError):
                raise ValueError(f"Le champ '{field}' doit être un nombre valide")

        # Validation des valeurs catégorielles
        valid_categories = list(self.category_mapping.keys())
        if input_data['Category'] not in valid_categories:
            raise ValueError(f"Catégorie invalide. Valeurs acceptées: {valid_categories}")

        valid_regions = list(self.region_mapping.keys())
        if input_data['Region'] not in valid_regions:
            raise ValueError(f"Région invalide. Valeurs acceptées: {valid_regions}")

        valid_weather = list(self.weather_mapping.keys())
        if input_data['Weather_Condition'] not in valid_weather:
            raise ValueError(f"Condition météorologique invalide. Valeurs acceptées: {valid_weather}")

        valid_seasons = list(self.seasonality_mapping.keys())
        if input_data['Seasonality'] not in valid_seasons:
            raise ValueError(f"Saisonnalité invalide. Valeurs acceptées: {valid_seasons}")

    def preprocess(self, input_data: dict):
        """Convertit les données d'entrée en format adapté au modèle"""

        try:
            # Validation des entrées
            self.validate_input(input_data)

            # Initialisation avec toutes les features à 0
            processed_data = {feature: 0.0 for feature in self.expected_features}

            # Mapping des noms de champs d'entrée vers les noms de features du modèle
            field_mappings = {
                'Inventory_Level': 'Inventory Level',
                'Units_Sold': 'Units Sold',
                'Units_Ordered': 'Units Ordered',
                'Discount': 'Discount',
                'Competitor_Pricing': 'Competitor Pricing'
            }

            # Remplissage des valeurs numériques
            for input_field, model_field in field_mappings.items():
                if input_field in input_data and model_field in processed_data:
                    processed_data[model_field] = float(input_data[input_field])

            # Gestion des variables binaires avec valeurs par défaut
            processed_data['Promotion'] = int(input_data.get('Promotion', 0))
            processed_data['Epidemic'] = int(input_data.get('Epidemic', 0))

            # Encodage one-hot pour les catégories
            if 'Category' in input_data:
                category_feature = self.category_mapping.get(input_data['Category'])
                if category_feature and category_feature in processed_data:
                    processed_data[category_feature] = 1.0

            # Encodage one-hot pour les régions
            if 'Region' in input_data:
                region_feature = self.region_mapping.get(input_data['Region'])
                if region_feature and region_feature in processed_data:
                    processed_data[region_feature] = 1.0

            # Encodage one-hot pour les conditions météorologiques
            if 'Weather_Condition' in input_data:
                weather_feature = self.weather_mapping.get(input_data['Weather_Condition'])
                if weather_feature and weather_feature in processed_data:
                    processed_data[weather_feature] = 1.0

            # Encodage one-hot pour la saisonnalité
            if 'Seasonality' in input_data:
                season_feature = self.seasonality_mapping.get(input_data['Seasonality'])
                if season_feature and season_feature in processed_data:
                    processed_data[season_feature] = 1.0

            # Calcul des variables dérivées
            self.calculate_derived_features(processed_data, input_data)

            # Création du DataFrame dans l'ordre attendu par le modèle
            df = pd.DataFrame([processed_data])
            df = df[self.expected_features]  # Assure l'ordre correct

            # Standardisation des colonnes numériques
            self.apply_scaling(df)

            logger.info("Préprocessing terminé avec succès")
            logger.debug(f"Données préprocessées: {df.iloc[0].to_dict()}")

            return df

        except Exception as e:
            logger.error(f"Erreur lors du préprocessing: {str(e)}")
            raise ValueError(f"Erreur de préprocessing: {str(e)}")

    def calculate_derived_features(self, processed_data: dict, input_data: dict):
        """Calcule les variables dérivées"""

        # Calcul de Sales_Rate (éviter division par zéro)
        inventory_level = processed_data.get('Inventory Level', 0)
        units_sold = processed_data.get('Units Sold', 0)

        if inventory_level > 0:
            processed_data['Sales_Rate'] = units_sold / inventory_level
        else:
            processed_data['Sales_Rate'] = 0.0

        # Calcul de Order_Fulfillment_Rate
        units_ordered = processed_data.get('Units Ordered', 0)

        if units_ordered > 0:
            processed_data['Order_Fulfillment_Rate'] = units_sold / units_ordered
        else:
            processed_data['Order_Fulfillment_Rate'] = 0.0

        # Calcul de l'interaction Promo_Discount
        promotion = processed_data.get('Promotion', 0)
        discount = processed_data.get('Discount', 0)
        processed_data['Promo_Discount_Interaction'] = promotion * discount

        # Ajout des variables dérivées depuis les entrées si disponibles
        if 'Sales_Rate' in input_data:
            processed_data['Sales_Rate'] = float(input_data['Sales_Rate'])

        if 'Order_Fulfillment_Rate' in input_data:
            processed_data['Order_Fulfillment_Rate'] = float(input_data['Order_Fulfillment_Rate'])

    def apply_scaling(self, df: pd.DataFrame):
        """Applique la standardisation aux colonnes numériques"""

        if hasattr(self.scaler, 'transform'):
            # Identification des colonnes numériques présentes dans le DataFrame
            numeric_cols = [col for col in self.numeric_features if col in df.columns]

            if numeric_cols:
                try:
                    # Vérification que le scaler a les bonnes features
                    if hasattr(self.scaler, 'feature_names_in_'):
                        scaler_features = list(self.scaler.feature_names_in_)
                        numeric_cols = [col for col in numeric_cols if col in scaler_features]

                    if numeric_cols:
                        df[numeric_cols] = self.scaler.transform(df[numeric_cols])
                        logger.info(f"Standardisation appliquée aux colonnes: {numeric_cols}")
                    else:
                        logger.warning("Aucune colonne numérique trouvée pour la standardisation")

                except Exception as e:
                    logger.error(f"Erreur lors de la standardisation: {str(e)}")
                    # Continue sans standardisation en cas d'erreur
                    pass

    def predict(self, input_data: dict):
        """Effectue la prédiction"""

        try:
            logger.info("Début de la prédiction")
            logger.debug(f"Données d'entrée: {input_data}")

            # Préprocessing des données
            processed_data = self.preprocess(input_data)

            # Vérification de la compatibilité avec le modèle
            if processed_data.shape[1] != len(self.expected_features):
                raise ValueError(
                    f"Incompatibilité: {processed_data.shape[1]} features reçues, {len(self.expected_features)} attendues")

            # Prédiction
            prediction = self.model.predict(processed_data)[0]

            # Validation du résultat
            if np.isnan(prediction) or np.isinf(prediction):
                raise ValueError("Prédiction invalide (NaN ou Inf)")

            result = float(prediction)
            logger.info(f"Prédiction réussie: {result}")

            return result

        except Exception as e:
            logger.error(f"Erreur lors de la prédiction: {str(e)}")
            raise ValueError(f"Erreur de prédiction: {str(e)}")

    def get_feature_info(self):
        """Retourne les informations sur les features attendues"""

        return {
            'expected_features': self.expected_features,
            'numeric_features': self.numeric_features,
            'categorical_mappings': {
                'categories': self.category_mapping,
                'regions': self.region_mapping,
                'weather_conditions': self.weather_mapping,
                'seasonality': self.seasonality_mapping
            }
        }

    def health_check(self):
        """Vérifie que le modèle est prêt à faire des prédictions"""

        try:
            # Test avec des données d'exemple
            test_data = {
                'Inventory_Level': 500,
                'Units_Sold': 120,
                'Units_Ordered': 200,
                'Discount': 15.5,
                'Competitor_Pricing': 89.99,
                'Sales_Rate': 78.5,
                'Order_Fulfillment_Rate': 95.2,
                'Promotion': 1,
                'Epidemic': 0,
                'Category': 'Electronics',
                'Region': 'North',
                'Weather_Condition': 'Sunny',
                'Seasonality': 'Summer'
            }

            result = self.predict(test_data)

            return {
                'status': 'healthy',
                'test_prediction': result,
                'model_features': len(self.expected_features),
                'message': 'Modèle opérationnel'
            }

        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'message': 'Erreur dans le modèle'
            }


# Fonction utilitaire pour créer une instance du modèle
def create_model_instance(model_path='model.pkl', scaler_path='scaler.pkl'):
    """Crée une instance du modèle avec gestion d'erreurs"""

    try:
        return MLModel(model_path, scaler_path)
    except Exception as e:
        logger.error(f"Impossible de créer l'instance du modèle: {str(e)}")
        raise


# Test de la classe (à exécuter seulement si ce fichier est exécuté directement)
if __name__ == "__main__":
    try:
        # Création d'une instance du modèle
        model = create_model_instance()

        # Test de santé
        health = model.health_check()
        print("Test de santé:", health)

        # Test avec des données d'exemple
        test_data = {
            'Inventory_Level': 500,
            'Units_Sold': 120,
            'Units_Ordered': 200,
            'Discount': 15.5,
            'Competitor_Pricing': 89.99,
            'Promotion': 1,
            'Epidemic': 0,
            'Category': 'Electronics',
            'Region': 'North',
            'Weather_Condition': 'Sunny',
            'Seasonality': 'Summer'
        }

        result = model.predict(test_data)
        print(f"Prédiction de test: {result}")

    except Exception as e:
        print(f"Erreur lors du test: {str(e)}")