import { GoogleGenAI, Type } from "@google/genai";
import { AgentRole, RouterResponse } from "../types";
import { AGENTS, ORCHESTRATOR_INSTRUCTION } from "../constants";

// Initialize Gemini Client
// Note: We use process.env.API_KEY as strictly required.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: The Orchestrator Logic.
 * Analyzes the user input and decides which agent should handle it.
 */
export const routeRequest = async (userMessage: string): Promise<RouterResponse> => {
  try {
    const model = "gemini-2.5-flash"; 
    
    const response = await ai.models.generateContent({
      model: model,
      contents: userMessage,
      config: {
        systemInstruction: ORCHESTRATOR_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetAgent: {
              type: Type.STRING,
              enum: [
                AgentRole.PATIENT_MANAGEMENT,
                AgentRole.APPOINTMENTS,
                AgentRole.MEDICAL_RECORDS,
                AgentRole.BILLING_INSURANCE,
              ],
              description: "The enum value of the agent best suited to handle the request."
            },
            reasoning: {
              type: Type.STRING,
              description: "Brief explanation of why this agent was selected."
            }
          },
          required: ["targetAgent", "reasoning"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Orchestrator");
    
    return JSON.parse(text) as RouterResponse;

  } catch (error) {
    console.error("Routing Error:", error);
    // Fallback to Patient Management if routing fails
    return {
      targetAgent: AgentRole.PATIENT_MANAGEMENT,
      reasoning: "Routing failed, defaulting to general management."
    };
  }
};

/**
 * Step 2: Specialist Execution.
 * Generates the actual response using the selected agent's persona.
 */
export const generateAgentResponse = async (
  agentRole: AgentRole, 
  history: { role: string; parts: { text: string }[] }[],
  userMessage: string
): Promise<string> => {
  
  const agentConfig = AGENTS[agentRole];
  // Use a smarter model for complex tasks like Medical/Billing if needed, 
  // but Flash is usually sufficient and fast.
  const model = "gemini-2.5-flash"; 

  const chat = ai.chats.create({
    model: model,
    history: history,
    config: {
      systemInstruction: agentConfig.systemInstruction,
      temperature: 0.7, // Balance between creativity and accuracy
    }
  });

  const result = await chat.sendMessage({ message: userMessage });
  return result.text || "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";
};