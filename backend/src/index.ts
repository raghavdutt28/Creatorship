import express from 'express';
import cors from 'cors';


import creatorRouter from './routers/creator';

const app = express();

app.use(express.json());
app.use(cors({
    credentials: true
}));

app.use("/v1/user", creatorRouter);
