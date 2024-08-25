import { MongoClient, Db } from 'mongodb';

let singleton: Db | null = null;

export default async (): Promise<Db> => {
  if (singleton) return singleton;

  const mongoHost = process.env.MONGO_HOST;
  if (!mongoHost) {
    throw new Error("MONGO_HOST environment variable is not set");
  }

  const client = new MongoClient(mongoHost);
  await client.connect();
  singleton = client.db(process.env.MONGO_DATABASE);
  return singleton;
};