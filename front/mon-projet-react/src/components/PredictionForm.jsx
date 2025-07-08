import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Info, RefreshCw } from 'lucide-react';

const PredictionForm = () => {
  const [formData, setFormData] = useState({
    Inventory_Level: '',
    Units_Sold: '',
    Units_Ordered: '',
    Discount: '',
    Competitor_Pricing: '',
    Sales_Rate: '',
    Order_Fulfillment_Rate: '',
    Promotion: '0',
    Epidemic: '0',
    Category: 'Electronics',
    Region: 'North',
    Weather_Condition: 'Sunny',
    Seasonality: 'Spring'
  });
  
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Exemples de données pour différents scénarios
  const examples = {
    electronicsHigh: {
      Inventory_Level: '1000',
      Units_Sold: '250',
      Units_Ordered: '300',
      Discount: '20',
      Competitor_Pricing: '199.99',
      Sales_Rate: '85.5',
      Order_Fulfillment_Rate: '95.2',
      Promotion: '1',
      Epidemic: '0',
      Category: 'Electronics',
      Region: 'North',
      Weather_Condition: 'Sunny',
      Seasonality: 'Summer'
    },
    furnitureNormal: {
      Inventory_Level: '150',
      Units_Sold: '45',
      Units_Ordered: '60',
      Discount: '10',
      Competitor_Pricing: '599.99',
      Sales_Rate: '70.0',
      Order_Fulfillment_Rate: '88.5',
      Promotion: '0',
      Epidemic: '0',
      Category: 'Furniture',
      Region: 'South',
      Weather_Condition: 'Rainy',
      Seasonality: 'Winter'
    },
    groceriesLow: {
      Inventory_Level: '2000',
      Units_Sold: '800',
      Units_Ordered: '1000',
      Discount: '5',
      Competitor_Pricing: '4.99',
      Sales_Rate: '95.0',
      Order_Fulfillment_Rate: '98.0',
      Promotion: '1',
      Epidemic: '1',
      Category: 'Groceries',
      Region: 'West',
      Weather_Condition: 'Snowy',
      Seasonality: 'Spring'
    }
  };

  const validateField = (name, value) => {
    const errors = {};
    
    // Validation des champs numériques
    const numericFields = [
      'Inventory_Level', 'Units_Sold', 'Units_Ordered', 
      'Discount', 'Competitor_Pricing', 'Sales_Rate', 'Order_Fulfillment_Rate'
    ];
    
    if (numericFields.includes(name)) {
      if (value === '' || value === null || value === undefined) {
        errors[name] = 'Ce champ est requis';
      } else {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors[name] = 'Doit être un nombre valide';
        } else if (numValue < 0) {
          errors[name] = 'Doit être un nombre positif';
        } else {
          // Validations spécifiques par champ
          if (name === 'Discount' && numValue > 100) {
            errors[name] = 'Le discount ne peut pas dépasser 100%';
          }
          if ((name === 'Sales_Rate' || name === 'Order_Fulfillment_Rate') && numValue > 100) {
            errors[name] = 'Le taux ne peut pas dépasser 100%';
          }
        }
      }
    }
    
    return errors;
  };

  const validateAllFields = () => {
    let allErrors = {};
    
    Object.keys(formData).forEach(key => {
      const fieldErrors = validateField(key, formData[key]);
      allErrors = { ...allErrors, ...fieldErrors };
    });
    
    setValidationErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const loadExample = (exampleType) => {
    setFormData(examples[exampleType]);
    setError(null);
    setPrediction(null);
    setValidationErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validation en temps réel
    const fieldErrors = validateField(name, value);
    setValidationErrors(prev => ({
      ...prev,
      ...fieldErrors,
      [name]: fieldErrors[name] || undefined
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAllFields()) {
      setError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Préparation des données avec validation
      const dataToSend = {
        ...formData,
        Inventory_Level: parseFloat(formData.Inventory_Level),
        Units_Sold: parseInt(formData.Units_Sold),
        Units_Ordered: parseInt(formData.Units_Ordered),
        Discount: parseFloat(formData.Discount),
        Competitor_Pricing: parseFloat(formData.Competitor_Pricing),
        Sales_Rate: formData.Sales_Rate ? parseFloat(formData.Sales_Rate) : null,
        Order_Fulfillment_Rate: formData.Order_Fulfillment_Rate ? parseFloat(formData.Order_Fulfillment_Rate) : null,
        Promotion: parseInt(formData.Promotion),
        Epidemic: parseInt(formData.Epidemic)
      };

      // Suppression des valeurs nulles pour les champs optionnels
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === null || dataToSend[key] === '') {
          delete dataToSend[key];
        }
      });

      console.log('Données envoyées:', dataToSend);
      
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const responseText = await response.text();
      console.log('Réponse brute:', responseText);
      
      if (!response.ok) {
        let errorMessage = `Erreur HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `${errorMessage}: ${responseText}`;
        }
        throw new Error(errorMessage);
      }
      
      const result = JSON.parse(responseText);
      
      if (result.prediction !== undefined) {
        setPrediction(result.prediction);
      } else {
        throw new Error('Réponse invalide du serveur: pas de prédiction');
      }
      
    } catch (err) {
      console.error('Erreur lors de la prédiction:', err);
      setError(err.message || 'Une erreur est survenue lors de la prédiction');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      Inventory_Level: '',
      Units_Sold: '',
      Units_Ordered: '',
      Discount: '',
      Competitor_Pricing: '',
      Sales_Rate: '',
      Order_Fulfillment_Rate: '',
      Promotion: '0',
      Epidemic: '0',
      Category: 'Electronics',
      Region: 'North',
      Weather_Condition: 'Sunny',
      Seasonality: 'Spring'
    });
    setError(null);
    setPrediction(null);
    setValidationErrors({});
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Prédiction de Prix</h2>
        <p className="text-gray-600">Utilisez ce formulaire pour prédire le prix basé sur les caractéristiques du produit</p>
      </div>
      
      {/* Boutons d'exemple */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Info className="w-5 h-5 mr-2" />
          Exemples de données
        </h3>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => loadExample('electronicsHigh')}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            type="button"
          >
            📱 Électronique (Prix élevé)
          </button>
          <button 
            onClick={() => loadExample('furnitureNormal')}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            type="button"
          >
            🪑 Mobilier (Prix normal)
          </button>
          <button 
            onClick={() => loadExample('groceriesLow')}
            className="bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
            type="button"
          >
            🥕 Épicerie (Prix bas)
          </button>
          <button 
            onClick={resetForm}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors flex items-center"
            type="button"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réinitialiser
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Champs numériques principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau d'inventaire *
            </label>
            <input 
              type="number" 
              name="Inventory_Level" 
              value={formData.Inventory_Level}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.Inventory_Level ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {validationErrors.Inventory_Level && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.Inventory_Level}</p>
            )}
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unités vendues *
            </label>
            <input 
              type="number" 
              name="Units_Sold" 
              value={formData.Units_Sold}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.Units_Sold ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {validationErrors.Units_Sold && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.Units_Sold}</p>
            )}
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unités commandées *
            </label>
            <input 
              type="number" 
              name="Units_Ordered" 
              value={formData.Units_Ordered}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.Units_Ordered ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {validationErrors.Units_Ordered && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.Units_Ordered}</p>
            )}
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remise (%) *
            </label>
            <input 
              type="number" 
              name="Discount" 
              value={formData.Discount}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.Discount ? 'border-red-500' : 'border-gray-300'
              }`}
              step="0.1"
              min="0"
              max="100"
              required
            />
            {validationErrors.Discount && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.Discount}</p>
            )}
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix concurrent *
            </label>
            <input 
              type="number" 
              name="Competitor_Pricing" 
              value={formData.Competitor_Pricing}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.Competitor_Pricing ? 'border-red-500' : 'border-gray-300'
              }`}
              step="0.01"
              min="0"
              required
            />
            {validationErrors.Competitor_Pricing && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.Competitor_Pricing}</p>
            )}
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taux de vente (%)
            </label>
            <input 
              type="number" 
              name="Sales_Rate" 
              value={formData.Sales_Rate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.Sales_Rate ? 'border-red-500' : 'border-gray-300'
              }`}
              step="0.1"
              min="0"
              max="100"
            />
            {validationErrors.Sales_Rate && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.Sales_Rate}</p>
            )}
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taux de satisfaction des commandes (%)
            </label>
            <input 
              type="number" 
              name="Order_Fulfillment_Rate" 
              value={formData.Order_Fulfillment_Rate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.Order_Fulfillment_Rate ? 'border-red-500' : 'border-gray-300'
              }`}
              step="0.1"
              min="0"
              max="100"
            />
            {validationErrors.Order_Fulfillment_Rate && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.Order_Fulfillment_Rate}</p>
            )}
          </div>
        </div>
        
        {/* Champs catégoriels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie *
            </label>
            <select
              name="Category"
              value={formData.Category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Electronics">Électronique</option>
              <option value="Furniture">Mobilier</option>
              <option value="Groceries">Épicerie</option>
              <option value="Toys">Jouets</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Région *
            </label>
            <select
              name="Region"
              value={formData.Region}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="North">Nord</option>
              <option value="South">Sud</option>
              <option value="West">Ouest</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conditions météo *
            </label>
            <select
              name="Weather_Condition"
              value={formData.Weather_Condition}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Sunny">Ensoleillé</option>
              <option value="Rainy">Pluvieux</option>
              <option value="Snowy">Neigeux</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saisonnalité *
            </label>
            <select
              name="Seasonality"
              value={formData.Seasonality}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Spring">Printemps</option>
              <option value="Summer">Été</option>
              <option value="Winter">Hiver</option>
            </select>
          </div>
        </div>
        
        {/* Cases à cocher */}
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="promotion"
              name="Promotion"
              checked={formData.Promotion === '1'}
              onChange={() => setFormData(prev => ({
                ...prev,
                Promotion: prev.Promotion === '1' ? '0' : '1'
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="promotion" className="ml-2 block text-sm text-gray-700">
              Promotion active
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="epidemic"
              name="Epidemic"
              checked={formData.Epidemic === '1'}
              onChange={() => setFormData(prev => ({
                ...prev,
                Epidemic: prev.Epidemic === '1' ? '0' : '1'
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="epidemic" className="ml-2 block text-sm text-gray-700">
              Situation d'épidémie
            </label>
          </div>
        </div>
        
        {/* Boutons de soumission */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Traitement...
              </>
            ) : 'Prédire le prix'}
          </button>
        </div>
      </form>
      
      {/* Affichage des erreurs */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Affichage des résultats */}
      {prediction !== null && (
        <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Prédiction réussie</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Le prix prédit est: <strong className="text-lg">${prediction.toFixed(2)}</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;