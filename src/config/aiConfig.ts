export const AI_CONFIG = {
  // OpenAI Configuration
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
    maxTokens: 1500,
    temperature: 0.7
  },
  
  // AssemblyAI Configuration
  assemblyai: {
    apiKey: import.meta.env.VITE_ASSEMBLYAI_API_KEY,
    endpoint: 'https://api.assemblyai.com/v2'
  },
  
  // Azure Speech Configuration
  azure: {
    apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
    region: import.meta.env.VITE_AZURE_SPEECH_REGION
  }
};

export const isConfigured = () => {
  return !!(AI_CONFIG.openai.apiKey && AI_CONFIG.openai.apiKey !== 'your_openai_api_key_here');
};