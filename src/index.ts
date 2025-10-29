import express from 'express';
import { ENV } from './config';
import parseRouter from './routes/parse.route';
import log4js from 'log4js';
import { logger } from './utils';
import path from 'path';
import fs from 'fs';

const app = express();

app.use(express.json());
app.use(log4js.connectLogger(logger, { level: 'info' }));

// Абсолютный путь к корневой папке public
const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Создаём папку, если её нет
if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Раздача статики из PUBLIC_DIR
app.use('/public', express.static(PUBLIC_DIR));
// Пример маршрута
app.use('/', parseRouter);

app.listen(ENV.PORT, () => {
    logger.info(`🚀 Server running at http://localhost:${ENV.PORT}`);
});
