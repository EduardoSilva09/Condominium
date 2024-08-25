import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import "express-async-errors";
import cors from 'cors'
import helmet from 'helmet';
import errorMiddleware from './middlewares/errorMiddleware';
import residentRouter from './routers/residentRouter'
import authController from './controller/authController'
import authenticationMiddleware from './middlewares/authenticationMiddleware';

const app = express();
app.use(morgan('tiny'));
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGN
}));

app.use(express.json());
app.post('/login', authController.doLogin);
app.use('/residents', authenticationMiddleware, residentRouter);
app.use('/', (req: Request, res: Response, next: NextFunction) => {
  res.send('Health Check');
});

app.use(errorMiddleware)
export default app;