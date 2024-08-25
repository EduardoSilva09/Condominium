import { NextFunction, Request, Response } from 'express';
import residentRepository from '../repositories/residentRepository'
import Resident from '../models/resident';

export async function getResident(req: Request, res: Response, next: NextFunction) {
  const wallet = req.params.wallet
  const resident = await residentRepository.getResident(wallet);

  if (!resident) return res.sendStatus(404);
  return res.json(resident);
}

export async function postResident(req: Request, res: Response, next: NextFunction) {
  const resident = req.body as Resident;
  const result = await residentRepository.addResident(resident);
  return res.status(201).json(result);
}

export async function patchResident(req: Request, res: Response, next: NextFunction) {
  const wallet = req.params.wallet
  const resident = req.body as Resident;
  const result = await residentRepository.updateResident(wallet, resident);
  return res.json(result);
}

export async function deleteResident(req: Request, res: Response, next: NextFunction) {
  const wallet = req.params.wallet
  const success = await residentRepository.deleteResident(wallet);
  if (success) return res.sendStatus(204);
  return res.sendStatus(400);
}

export default {
  getResident,
  postResident,
  patchResident,
  deleteResident
}