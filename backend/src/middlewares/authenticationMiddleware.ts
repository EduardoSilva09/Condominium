import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = `${process.env.JWT_SECRET}`

export default (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization'];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      if (decoded) {
        res.locals.token = decoded;
      }
      console.error(`Token decoded error.`);
    } catch (error) {
      console.error(error);
    }
  } else {
    console.error(`No token provided.`);
  }
  return res.sendStatus(401);
}