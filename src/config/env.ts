import dotenv from 'dotenv';
dotenv.config();

const port = process.env.PORT || 3000;

export const ENV = {
    PORT: port,
    NODE_ENV: process.env.NODE_ENV || 'development',
    OPENAI_KEY: process.env.OPENAI_KEY || '',
    APIFY_KEY: process.env.APIFY_KEY || '',
    SALEBOT_KEY: process.env.SALEBOT_KEY || '',
    SERVER_URL: process.env.NODE_ENV == 'production' ? process.env.SERVER_URL : `http://localhost:${port}`,
};

