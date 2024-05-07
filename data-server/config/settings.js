import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: './client/.env'});
export const mongoConfig = {
  serverUrl: process.env.MONGO_SERVER_URL,
  database: "VeilChatMongoDB",
};