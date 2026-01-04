
import { GoogleGenAI, Type } from "@google/genai";
import { Order, Courier, Product, Prediction, Location } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const findClosestCourierAI = async (order: Order, couriers: Courier[]): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analise o local do pedido (${order.location.lat}, ${order.location.lng}) e a lista de entregadores: ${JSON.stringify(couriers)}. 
    Determine o ID do entregador mais eficiente e mais próximo geograficamente.
    Retorne JSON: {"courierId": "string", "reasoning": "string"}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          courierId: { type: Type.STRING },
          reasoning: { type: Type.STRING }
        },
        required: ["courierId", "reasoning"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text.trim());
    return result.courierId;
  } catch (e) {
    console.error("AI Dispatch Error:", e);
    return couriers[0]?.id;
  }
};

export const processVoiceCommandAI = async (transcript: string, pendingOrders: Order[], availableCouriers: Courier[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Interprete o seguinte comando de voz do administrador: "${transcript}".
    Pedidos Pendentes: ${JSON.stringify(pendingOrders.map(o => ({ id: o.id, number: o.orderNumber, client: o.clientName })))}
    Entregadores Online: ${JSON.stringify(availableCouriers.map(c => ({ id: c.id, name: c.name })))}
    
    Identifique qual pedido e qual entregador foram mencionados. 
    Retorne JSON: {"orderId": "string", "courierId": "string", "success": boolean, "message": "string"}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          orderId: { type: Type.STRING },
          courierId: { type: Type.STRING },
          success: { type: Type.BOOLEAN },
          message: { type: Type.STRING }
        },
        required: ["orderId", "courierId", "success", "message"]
      }
    }
  });

  return JSON.parse(response.text.trim());
};

export const optimizeRouteAI = async (courierLoc: Location, orders: Order[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Otimização logística para entregas múltiplas iFood.
    Local Atual do Entregador: ${JSON.stringify(courierLoc)}
    Lista de Pedidos Atribuídos: ${JSON.stringify(orders.map(o => ({ id: o.id, loc: o.location, number: o.orderNumber })))}
    
    CRITÉRIO OBRIGATÓRIO: Organize os pedidos em uma sequência que minimize drasticamente o Km total e o tempo de percurso (do mais próximo para o próximo mais próximo sucessivamente).
    
    Retorne JSON com: 
    - orderedIds: array de IDs na ordem de entrega.
    - totalKm: string (ex: "4.5 km")
    - totalTimeMinutes: number (estimativa total)
    - aiAdvice: string curta explicando por que esta é a melhor rota.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          orderedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          totalKm: { type: Type.STRING },
          totalTimeMinutes: { type: Type.NUMBER },
          aiAdvice: { type: Type.STRING }
        },
        required: ["orderedIds", "totalKm", "totalTimeMinutes", "aiAdvice"]
      }
    }
  });
  
  return JSON.parse(response.text.trim());
};

export const predictInventoryNeedsAI = async (products: Product[]): Promise<Prediction[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Análise preditiva de estoque. Dados: ${JSON.stringify(products)}. 
    Retorne array de objetos JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            productId: { type: Type.STRING },
            estimatedDaysRemaining: { type: Type.NUMBER },
            recommendedRestock: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["productId", "estimatedDaysRemaining", "recommendedRestock", "reasoning"]
        }
      }
    }
  });

  return JSON.parse(response.text.trim());
};
