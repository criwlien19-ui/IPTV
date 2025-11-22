import { GoogleGenAI } from "@google/genai";
import { Subscriber, Offer } from '../types';

// Clé API par défaut fournie par l'utilisateur
const DEFAULT_API_KEY = 'AIzaSyBhDhD-thqxZo0tH1SzHXfIIVOZj5Uk30E';

// Récupération sécurisée de la clé
const getApiKey = (): string => {
  // Tentative via process.env (injecté par Vite)
  try {
    if (process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore error if process is undefined
  }
  return DEFAULT_API_KEY;
};

const apiKey = getApiKey();

// Helper to format data for the AI context
const formatContext = (subs: Subscriber[], offers: Offer[]) => {
  return JSON.stringify({
    subscribers: subs.map(s => ({
      name: s.fullName,
      email: s.email,
      status: s.status,
      endDate: s.endDate,
      offerId: s.offerId
    })),
    offers: offers,
    currentDate: new Date().toISOString()
  });
};

export const generateAIResponse = async (
  prompt: string, 
  subscribers: Subscriber[], 
  offers: Offer[]
): Promise<string> => {
  if (!apiKey) {
    return "Erreur de configuration : La clé API Gemini est manquante.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const context = formatContext(subscribers, offers);
    const fullPrompt = `
      Tu es l'assistant virtuel officiel de la plateforme "ALL IPTV".
      Voici les données actuelles du système en JSON :
      ${context}

      Ta mission est d'aider le gestionnaire à analyser les données, rédiger des emails de relance, ou suggérer des stratégies marketing pour ALL IPTV.
      Réponds toujours en français de manière professionnelle, concise et serviable.
      Si tu proposes des actions, assure-toi qu'elles sont pertinentes pour un service de streaming IPTV.
      
      La demande de l'utilisateur est : "${prompt}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    return response.text || "Désolé, je n'ai pas pu générer de réponse pertinente pour le moment.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Retourne le message d'erreur réel pour aider au diagnostic
    return `Erreur technique IA : ${error.message || 'Erreur inconnue'}. (Vérifiez votre clé API ou vos quotas)`;
  }
};

export const generateRenewalEmail = async (subscriber: Subscriber, offer: Offer): Promise<string> => {
    if (!apiKey) return "Erreur : Clé API manquante.";
    
    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
            Rédige un email commercial et percutant pour le client ${subscriber.fullName}.
            Contexte : Son abonnement "${offer.name}" chez ALL IPTV expire le ${new Date(subscriber.endDate).toLocaleDateString()}.
            Objectif : Le convaincre de renouveler immédiatement pour ne pas perdre l'accès à ses chaînes et VOD préférées.
            
            Ton : Professionnel, urgent mais amical.
            
            Règles strictes :
            1. L'objet de l'email doit être accrocheur (Ex: "⚠️ Ne perdez pas votre accès ALL IPTV").
            2. Le corps du message doit être clair.
            3. La signature doit être OBLIGATOIREMENT : "L'équipe ALL IPTV".
            
            Format de sortie souhaité :
            Objet: [Ton objet ici]
            
            [Corps du message ici]
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text || "Erreur : La génération de l'email a échoué.";
    } catch (error: any) {
        console.error("Gemini Email Error:", error);
        return `Erreur IA : ${error.message || "Impossible de contacter le service."}`;
    }
};

export const generateOfferImage = async (offerName: string, description: string): Promise<string | null> => {
    if (!apiKey) {
        console.error("API Key missing for image generation");
        return null;
    }
  
    try {
      const ai = new GoogleGenAI({ apiKey });
      // Prompt optimized for icon/marketing image generation specific to ALL IPTV branding
      const prompt = `Create a premium, high-tech 3D icon for an IPTV subscription service called "ALL IPTV". 
      Package Name: "${offerName}".
      Description context: "${description}".
      Visual Style: Cyberpunk aesthetic, neon glowing accents (blue, purple, cyan), dark metallic background, glossy finish.
      The image should look like a high-end digital product badge or shield.
      No text inside the image, just the symbol/graphic representation.`;
      
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });
  
      const base64 = response.generatedImages?.[0]?.image?.imageBytes;
      return base64 ? `data:image/jpeg;base64,${base64}` : null;
    } catch (error) {
      console.error("Gemini Image Gen Error:", error);
      return null;
    }
  };
