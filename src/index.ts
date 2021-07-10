// tslint:disable-next-line
require('tsconfig-paths/register');
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { Request, Response, NextFunction } from 'express';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import passport from 'passport';
import helmet from 'helmet';
import cron from 'node-cron';

import { toolCheck } from 'uptime';
import { tools } from 'tools';
dotenv.config();
require('dotenv-defaults/config');

import { userPassportAuth } from '@config/passport';
import { API_BASE } from '@config/constants';
import * as RoutesLib from '@config/route-defs';

const PORT = process.env.PORT;
const db = `mongodb://localhost:27017/${process.env.DB_NAME}`;

mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

mongoose.connection.on('connected', () => {
  console.log(`Database Connected: ${db}`);
});

mongoose.connection.on('error', (err: any) => {
  console.log('Database Error: ' + err);
});

// CORS
const accessControl = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'http://127.0.0.1:4000', 'http://localhost:4000', 'http://127.0.0.1:4200', 'http://bioinfo.usu.edu'
  ];
  const origin = req.headers.origin;
  /*
  if (origin && typeof origin === 'string' && allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  */
  res.header('Access-Control-Allow-Origin', 'http://bioinfo.usu.edu');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, KBL-User-Agent');
  res.header('Access-Control-Allow-Credentials', 'true');
  return next();
}

// Allows other domains to use this domain as an API
const originsWhitelist = [
  'http://127.0.0.1:4000', 'http://localhost:4000', 'http://127.0.0.1:4200', 'http://localhost:4200'
];
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (origin && originsWhitelist.indexOf(origin) >= -1) {
      return callback(null, true);
    }

    const error = new Error('CORS Error');

    return callback(error, false);
  }
}

const cOpt: cors.CorsOptions = {
  origin: 'http://localhost:4200',
  credentials: true
}

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(helmet());
app.use(accessControl);

// Passport
userPassportAuth(passport);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use(API_BASE + 'persons', RoutesLib.PersonRoutes);
app.use(API_BASE + 'news', RoutesLib.NewsArticleRoutes);
app.use(API_BASE + 'appointments', RoutesLib.AppointmentRoutes);
app.use(API_BASE + 'email', RoutesLib.EmailRoutes);
app.use(API_BASE + 'uptime', RoutesLib.UptimeRoutes);
app.use(API_BASE + 'modfiles', RoutesLib.ModFilesRoutes);
app.use(API_BASE + 'quotas', RoutesLib.QuotaRoutes);

app.get(API_BASE, (req: Request, res: Response) => {
  res.status(404).send('<h1 style="color: blue; text-align: center;">404 Error</h1>');
});

app.get(`${API_BASE}toolavail`, (req: Request, res: Response) => {
  res.json(tools);
})

// Server
app.listen(PORT, () => {
  console.log('\nKBL started in mode \'' + process.env.NODE_ENV + '\'');
  console.log('TLS/HTTPS is off.');
  console.log('Port: ' + PORT);
  console.log(`Reachable at ${API_BASE}`);
  toolCheck(tools);
  cron.schedule('*/15 * * * *', () => {
    toolCheck(tools);
  })
});
