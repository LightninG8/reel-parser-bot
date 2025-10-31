import { ApifyClient } from 'apify-client';
import { ENV } from '../config/env';
import { logger } from '../utils';
import { salebotService } from './salebot.service';

const client = new ApifyClient({ token: ENV.APIFY_KEY });

export const apifyService = {
    runActor: async (actorSettings: { actor: string; input: any; options: any }) => {
        const { actor, input, options } = actorSettings;
        try {
            logger.info(`🚀 Запуск актора ${actor}, настройки ${JSON.stringify(input)}`);

            const run = await client.actor(actor).call(input, options);

            // ждем завершения выполнения актора и получения данных
            const dataset = await client.dataset(run.defaultDatasetId).listItems();
            const items = dataset.items;

            logger.info(`✅ Выполнен актор ${actor}...`);

            return items;
        } catch (err) {
            logger.error('❌ Ошибка Apify:', err);

            throw new Error(`Не удалось запустить актор ${actor}`);
        }
    },

    configureReelScrapper(tags: string[], reels_count = 1000) {
        return {
            actor: 'hpix/ig-reels-scraper',
            input: {
                custom_functions: '{ shouldSkip: (data) => data.comment_count < 200, shouldContinue: (data) => true }',
                include_raw_data: true,
                reels_count,
                tags,
                target: 'reels_only',
            },
            options: { memory: 1024, timeout: 1800 },
        };
    },
    configureReelTranscript(link: string) {
        return {
            actor: 'linen_snack/instagram-videos-transcipt-subtitles-and-translate',
            input: {
                instagramUrl: link,
                language: 'ru',
                model: 'gpt-4o-mini-transcribe',
                openaiApiKey: ENV.OPENAI_KEY,
                response_format: 'json',
                task: 'transcription',
            },
            options: { memory: 128, timeout: 1800 },
        };
    },
};
