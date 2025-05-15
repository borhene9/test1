import { CohereClient } from 'cohere-ai';

// Initialize Cohere API
let cohere: CohereClient;
try {
  if (!process.env.COHERE_API_KEY) {
    console.error('COHERE_API_KEY is not defined in environment variables');
  } else {
    cohere = new CohereClient({
      token: process.env.COHERE_API_KEY
    });
    console.log('Cohere API initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Cohere API:', error);
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle rate limits with exponential backoff
async function generateWithRetry(prompt: string, maxRetries = 3) {
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount < maxRetries) {
    try {
      const response = await cohere.generate({
        prompt: prompt,
        maxTokens: 1000,
        temperature: 0.7,
        k: 0,
        stopSequences: [],
        returnLikelihoods: 'NONE'
      });
      return response;
    } catch (error: any) {
      lastError = error;
      if (error.status === 429) { // Rate limit error
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.log(`Rate limit hit, retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
        retryCount++;
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

export { cohere, generateWithRetry }; 