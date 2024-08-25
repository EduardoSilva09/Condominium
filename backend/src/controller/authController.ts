import { NextFunction, Request, Response } from 'express';
import residentRepository from '../repositories/residentRepository';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

type LoginData = {
  wallet: string;
  secret: string;
  timestamp: number;
}

const JWT_SECRET = `${process.env.JWT_SECRET}`
const JWT_EXPIRES = parseInt(`${process.env.JWT_EXPIRES}` || "1800")

async function doLogin(req: Request, res: Response, next: NextFunction) {
  const data = req.body as LoginData;

  if (data.timestamp < (Date.now() - (30 * 1000)))
    return res.status(401).send(`Timestamp too old.`);

  const message = `Authentication to condominium. Timestamp: ${data.timestamp}`;
  const signer = ethers.utils.verifyMessage(message, data.secret);

  if (signer.toLowerCase() === data.wallet.toLowerCase()) {

    const resident = await residentRepository.getResident(data.wallet);
    if (!resident) return res.status(401).send(`Resident not found`);

    const token = jwt.sign({ ...data, profile: resident.profile }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES
    })

    return res.json({ token });

  }
  return res.status(401).send(`Wallet and secret doen't match.`)
}

export default {
  doLogin
}