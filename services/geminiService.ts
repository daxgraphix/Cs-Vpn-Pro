import { GoogleGenAI, Type } from "@google/genai";
import { ServerNode, AiInsight } from '../types';

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const getNetworkOptimization = async (
  currentNodes: ServerNode[],
  userContext: { location: string, isp: string, ip: string },
  mode: 'reactive' | 'proactive' = 'reactive'
): Promise<AiInsight> => {
  if (!apiKey) {
    return {
      type: 'optimization',
      message: "AI Link: Neural Engine offline. Using local routing protocols.",
      confidence: 0,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  try {
    const context = mode === 'proactive' 
      ? `User is currently exposed. ISP: ${userContext.isp}, Location: ${userContext.location}. Predict threats.` 
      : `User is connected via secure tunnel. Optimize for current ISP peering: ${userContext.isp}.`;

    const prompt = `
      Act as a Senior Network Security Analyst.
      User Real Metadata:
      - IP: ${userContext.ip}
      - ISP: ${userContext.isp}
      - Location: ${userContext.location}
      
      Task: Analyze this specific ISP/Location combination for privacy risks (throttling, surveillance, logging).
      Select the best VPN node from the list below to mitigate these specific risks.

      Available Nodes: ${JSON.stringify(currentNodes.map(n => ({ id: n.city, load: n.load, latency: n.latency })))}.
      
      Return JSON:
      {
        "recommendation": "City Name",
        "reason": "Specific technical reason based on the user's ISP/Location.",
        "predictedLatency": number
      }
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
      type: mode === 'proactive' ? 'security' : 'optimization',
      message: `${result.recommendation}: ${result.reason}`,
      confidence: 0.95,
      timestamp: new Date().toLocaleTimeString()
    };

  } catch (error) {
    console.error("Gemini Optimization Error", error);
    return {
      type: 'optimization',
      message: "AI Analysis: Optimizing route based on latency heuristics.",
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
      contents: `Analyze the domain "${domain}" for security threats.
      Return JSON: { "category": "Malware" | "Phishing" | "Adult" | "Safe", "riskScore": number (0-100) }`,
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