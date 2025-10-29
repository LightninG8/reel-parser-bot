import { Router, Request, Response } from 'express';
import { apifyService, salebotService, sheetService } from '../services';
import { logger } from '../utils';

const parseRouter = Router();

parseRouter.post('/parse', async (req: Request, res: Response) => {
    let usernames = req.body['usernames'];
    const clientId = +req.body['clientId'];
    const limit = +req.body['limit'];

    if (typeof usernames === 'string') {
        usernames = JSON.parse(usernames);
    }

    if (!Array.isArray(usernames) || usernames.length === 0) {
        return res.status(400).json({ error: 'Invalid request: usernames[] обязательно' });
    }

    if (!clientId) {
        return res.status(400).json({ error: 'Invalid request: clientId обязательно' });
    }

    try {
        const flow = async () => {
            logger.log('🔄 Запуск парсинга Instagram аккаунтов...');

            const reelsArray = await Promise.all(
                usernames.map(async (username) => {
                    // Формируем input для каждого пользователя
                    const actorInput = apifyService.configureReelScrapper([username], limit);

                    // Запускаем актор
                    const result = await apifyService.runActor(actorInput, clientId);

                    // Можно фильтровать при необходимости
                    const filtered = result.filter((r: any) => (r.commentsCount || 0) >= 100) as any[];

                    // Вызываем вебхук после завершения каждого пользователя
                    await salebotService.sendParsingProgressWebhook(clientId, filtered.length, username);

                    return filtered;
                })
            );

            // Объединяем все результаты в один массив
            const reels = reelsArray.flat();

            // Сортировка по количеству просмотров в порядке убывания
            const sortedReels = reels.sort((a, b) => b.videoPlayCount - a.videoPlayCount);

            logger.log(`📊 Отфильтровано и отсортировано ${sortedReels.length} видео`);

            const enriched = await Promise.all(
                reels.map(async (video: any) => {
                    try {
                        const transcript = await apifyService.runActor(apifyService.configureReelTranscript(video.url), clientId);

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
