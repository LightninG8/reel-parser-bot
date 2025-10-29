import { logger } from '../utils';
import fs from 'fs';
import path from 'path';
import { parse } from 'json2csv';
import { ENV } from '../config';

export const sheetService = {
    createCsv: async (data: any[], filePath = './public/output.csv') => {
        try {
            // Формируем данные в удобном порядке
            const rows = data.map((post) => ({
                'ID поста': post.id,
                Тип: post.type,
                'Имя пользователя': post.ownerUsername,
                'Полное имя': post.ownerFullName,
                'Подпись (описание)': post.caption?.replace(/\n/g, ' ') || '',
                'Первый комментарий': post.firstComment || '',
                Хэштеги: post.hashtags?.join(', ') || '',
                Упоминания: post.mentions?.join(', ') || '',
                Лайков: post.likesCount,
                Комментариев: post.commentsCount,
                'Просмотров видео': post.videoPlayCount ?? '',
                'Ссылка на пост': post.url,
                'Дата публикации': post.timestamp,
                'Ссылка на фото': post.displayUrl,
                'Ссылки на изображения (если несколько)': post.images?.join(', ') || '',
                'Ссылка на видео': post.videoUrl || '',
                'Исполнитель (музыка)': post.musicInfo?.artist_name || '',
                'Название трека': post.musicInfo?.song_name || '',
                'Расшифровка речи (транскрипт)': post.transcript?.replace(/\n/g, ' ') || '',
            }));

            // Определяем порядок столбцов вручную
            const fields = [
                'ID поста',
                'Тип',
                'Ссылка на пост',
                'Имя пользователя',
                'Полное имя',
                'Дата публикации',
                'Подпись (описание)',
                'Первый комментарий',
                'Хэштеги',
                'Упоминания',
                'Лайков',
                'Комментариев',
                'Просмотров видео',
                'Исполнитель (музыка)',
                'Название трека',
                'Расшифровка речи (транскрипт)',
                'Ссылка на фото',
                'Ссылки на изображения (если несколько)',
                'Ссылка на видео',
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
