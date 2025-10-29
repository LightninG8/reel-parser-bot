import { ApifyClient } from 'apify-client';
import { ENV } from '../config/env';
import { logger } from '../utils';

const client = new ApifyClient({ token: ENV.APIFY_KEY });

export const apifyService = {
    runActor: async (actorSettings: { actor: string; input: any }) => {
        const { actor, input } = actorSettings;
        try {
            logger.info(`🚀 Запуск актора ${actor}, настройки ${JSON.stringify(input)}`);

            const run = await client.actor(actor).call(input);

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

    configureReelScrapper(username: string[]) {
        return {
            actor: 'apify/instagram-reel-scraper',
            input: {
                includeSharesCount: false,
                resultsLimit: 2,
                username,
            },
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
        };
    },
};
