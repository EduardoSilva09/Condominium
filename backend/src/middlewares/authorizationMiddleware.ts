import { NextFunction, Request, Response } from 'express';
import { LoginData } from '../controller/authController';
import { Profile } from '../models/resident';

export function onlyManager(req: Request, res: Response, next: NextFunction) {
  const token = res.locals.token;
  if (!token) return res.sendStatus(403);
  const loginData = token as LoginData & { profile: Profile };

  if (loginData.profile === Profile.MANAGER) {
    return next();
  }
  return res.sendStatus(403);
}

export function onlyCounselor(req: Request, res: Response, next: NextFunction) {
  const token = res.locals.token;
  if (!token) return res.sendStatus(403);
  const loginData = token as LoginData & { profile: Profile };

  if (loginData.profile !== Profile.RESIDENT) {
    return next();
  }
  return res.sendStatus(403);
}