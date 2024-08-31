import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import "express-async-errors";
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import errorMiddleware from './middlewares/errorMiddleware';
import residentRouter from './routers/residentRouter';
import authController from './controller/authController';
import topicFileRouter from './routers/topicFileRouter';
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

const uploadMiddleware = multer({ dest: "files" });
app.use('/topicfiles/', authenticationMiddleware, uploadMiddleware.single("file"), topicFileRouter);

app.use('/', (req: Request, res: Response, next: NextFunction) => {
  res.send(`Health Check`);
})

app.use(errorMiddleware);

app.use(errorMiddleware)
export default app;