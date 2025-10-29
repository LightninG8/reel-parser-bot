import { Router, Request, Response } from 'express';
import { apifyService, salebotService, sheetService } from '../services';
import { logger } from '../utils';

const parseRouter = Router();

parseRouter.post('/parse', async (req: Request, res: Response) => {
    const username = req.body['username'];
    const clientId = +req.body['clientId'];

    if (!Array.isArray(username) || username.length === 0) {
        return res.status(400).json({ error: 'Invalid request: username[] обязательно' });
    }

    if (!clientId) {
        return res.status(400).json({ error: 'Invalid request: clientId обязательно' });
    }

    try {
        const flow = async () => {
            logger.log('🔄 Запуск парсинга Instagram аккаунтов...');

            const reels = await apifyService.runActor(apifyService.configureReelScrapper(username));

            // Можно фильтровать при необходимости
            // const filtered = reels.filter((r: any) => (r.commentsCount || 0) >= 100);
            const filtered = reels;
            logger.log(`📊 Отфильтровано ${filtered.length} видео`);

            const enriched = await Promise.all(
                filtered.map(async (video: any) => {
                    try {
                        const transcript = await apifyService.runActor(apifyService.configureReelTranscript(video.url));

                        // если актор вернул результат корректно
                        const text = (transcript as any)?.[0]?.result?.text ?? '';
                        return { ...video, transcript: text };
                    } catch (error) {
                        // логируем, но не прерываем выполнение
                        logger.error(`⚠️ Ошибка при транскрипции видео ${video.url}:`, error);
                        return { ...video, transcript: '' }; // возвращаем видео без поля transcript
                    }
                })
            );

            const sheetUrl = await sheetService.createCsv(enriched, `./public/${clientId}/Результаты.csv`);

            await salebotService.sendParsingSuccessWebhook(clientId, sheetUrl, enriched.length);
        };

        flow();

        res.status(200).json({ status: 'Parsing started' });
    } catch (err) {
        logger.error('❌ Ошибка при запуске парсинга:', err);
        await salebotService.sendServerErrorWebhook(clientId);
        res.status(500).json({ error: 'Failed to start parsing', message: err });
    }
});

export default parseRouter;
