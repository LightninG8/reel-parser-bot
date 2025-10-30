import { logger } from '../utils';
import fs from 'fs';
import path from 'path';
import { parse } from 'json2csv';
import { ENV } from '../config';

export const sheetService = {
    createCsv: async (data: any[], filePath = './public/output.csv') => {
        try {
            // Формируем данные в удобном порядке
            const rows = data.map((post, i) => ({
                '№': i + 1,
                Ссылка: `https://instagram.com/p/${post.code}`,
                Аккаунт: post.raw_data?.user?.username,
                Описание: post.raw_data?.caption?.text.replace(/\n/g, ' ') || '',
                Лайки: post.like_count,
                Комментарии: post.comment_count,
                Просмотры: post.play_count,
                Транскрипт: post.transcript?.replace(/\n/g, ' ') || '',
                // Ссылка: post.url,
                // Аккаунт: post.ownerUsername,
                // Описание: post.caption?.replace(/\n/g, ' ') || '',
                // Лайки: post.likesCount,
                // Комментарии: post.commentsCount,
                // Просмотры: post.videoPlayCount ?? '',
                // Транскрипт: post.transcript?.replace(/\n/g, ' ') || '',
                // 'ID поста': post.id,
                // Тип: post.type,
                // 'Полное имя': post.ownerFullName,
                // 'Первый комментарий': post.firstComment || '',
                // Хэштеги: post.hashtags?.join(', ') || '',
                // Упоминания: post.mentions?.join(', ') || '',
                // 'Дата публикации': post.timestamp,
                // 'Ссылка на фото': post.displayUrl,
                // 'Ссылки на изображения (если несколько)': post.images?.join(', ') || '',
                // 'Ссылка на видео': post.videoUrl || '',
                // 'Исполнитель (музыка)': post.musicInfo?.artist_name || '',
                // 'Название трека': post.musicInfo?.song_name || '',
            }));

            // Определяем порядок столбцов вручную
            const fields = [
                '№',
                'Ссылка',
                'Аккаунт',
                'Описание',
                'Лайки',
                'Комментарии',
                'Просмотры',
                'Транскрипт',
                // 'ID поста',
                // 'Тип',
                // 'Полное имя',
                // 'Первый комментарий',
                // 'Хэштеги',
                // 'Упоминания',
                // 'Дата публикации',
                // 'Ссылка на фото',
                // 'Ссылки на изображения (если несколько)',
                // 'Ссылка на видео',
                // 'Исполнитель (музыка)',
                // 'Название трека',
            ];

            // Конвертируем JSON → CSV
            const csv = parse(rows, {
                fields,
                delimiter: ';', // чтобы корректно открывалось в Excel
                quote: '"',
            });

            // Добавляем BOM, чтобы Excel правильно читал UTF-8
            const csvWithBom = '\uFEFF' + csv;

            // Перезаписываем файл
            // Убедиться, что папка существует
            const dir = path.dirname(filePath);
            fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(filePath, csvWithBom, 'utf8');

            logger.log(`✅ CSV успешно создан: ${filePath}`);

            return `${ENV.SERVER_URL}/${filePath.replace('./', '')}`;
        } catch (error) {
            logger.error('❌ Ошибка при создании CSV:', error);
            throw new Error(error as string);
        }
    },
};
