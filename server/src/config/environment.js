import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/droppilot',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || process.env.HUGGING_FACE_API_KEY || '',
  shopify: {
    clientId: process.env.SHOPIFY_CLIENT_ID || '',
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || 'droppilot-demo-store.myshopify.com',
    scopes: process.env.SHOPIFY_SCOPES || 'read_products,write_products',
    redirectUri: process.env.SHOPIFY_REDIRECT_URI || '',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
};

export default config;

