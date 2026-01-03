import { GoogleGenAI, Type } from "@google/genai";
import { ServerNode, AiInsight } from '../types';

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const getNetworkOptimization = async (
  currentNodes: ServerNode[],
  userLocation: string,
  mode: 'reactive' | 'proactive' = 'reactive'
): Promise<AiInsight> => {
  if (!apiKey) {
    return {
      type: 'optimization',
      message: mode === 'proactive' 
        ? "AI Prediction: Traffic load expected to rise. Recommending US-East." 
        : "AI Optimization unavailable. Using local heuristics.",
      confidence: 0,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  try {
    const context = mode === 'proactive' 
      ? "The user is currently disconnected. Predict the best server for the next hour based on historical global traffic patterns and current time." 
      : "The user is connected. Analyze current node metrics for optimal streaming performance.";

    const prompt = `
      You are a Network AI Controller for a global VPN.
      User Location: ${userLocation}.
      Context: ${context}
      Available Nodes (JSON): ${JSON.stringify(currentNodes.map(n => ({ id: n.id, city: n.city, load: n.load, latency: n.latency })))}.
      
      Return a short JSON object with: 
      - recommendation: string (The Node ID)
      - reason: string (1 sentence explanation, mention "predicted load" if proactive)
      - predictedLatency: number
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING },
            reason: { type: Type.STRING },
            predictedLatency: { type: Type.NUMBER }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      type: mode === 'proactive' ? 'prediction' : 'optimization',
      message: `${mode === 'proactive' ? 'Proactive:' : 'Recommended:'} ${result.recommendation}. ${result.reason}`,
      confidence: 0.95,
      timestamp: new Date().toLocaleTimeString()
    };

  } catch (error) {
    console.error("Gemini Optimization Error", error);
    return {
      type: 'optimization',
      message: "AI analysis failed. Fallback routing engaged.",
      confidence: 0.5,
      timestamp: new Date().toLocaleTimeString()
    };
  }
};

export const classifyDomainThreat = async (domain: string): Promise<{ category: string, risk: number }> => {
  if (!apiKey) return { category: 'Unknown', risk: 0 };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Classify the domain "${domain}" for a family-safe VPN filter. 
      Categories: Adult, Gambling, Malware, Safe, Phishing. 
      Return JSON: { "category": string, "riskScore": number (0-100) }`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            riskScore: { type: Type.NUMBER }
          }
        }
      }
    });
    
    const result = JSON.parse(response.text || '{}');
    return { category: result.category || 'Unknown', risk: result.riskScore || 0 };
  } catch (e) {
    return { category: 'Unknown', risk: 0 };
  }
}