import Resident from "src/models/resident";
import connect from "../db";

const COLLECTION = "residents";

async function getResident(wallet: string): Promise<Resident | null> {
  const db = await connect();
  const resident = await db.collection(COLLECTION).findOne({ wallet });
  if (!resident) return null;
  return new Resident(
    resident.wallet,
    resident.name,
    resident.phone,
    resident.email,
    resident.profile
  )
}

async function addResident(resident: Resident): Promise<Resident> {
  const db = await connect();
  const result = await db.collection(COLLECTION).insertOne(resident);
  resident._id = result.insertedId;
  return resident;
}

async function updateResident(wallet: string, data: Resident): Promise<Resident | null> {
  const db = await connect();
  await db.collection(COLLECTION).updateOne({ wallet }, { $set: data });
  return getResident(wallet);
}

async function deleteResident(wallet: string): Promise<boolean> {
  const db = await connect();
  const result = await db.collection(COLLECTION).deleteOne({ wallet });
  return (result.deletedCount > 0);
}

export default { getResident, addResident, updateResident, deleteResident }