import { Router, Request, Response } from "express";
import { apifyService, salebotService, sheetService } from "../services";
import { logger } from "../utils";

const parseRouter = Router();

parseRouter.post("/parse", async (req: Request, res: Response) => {
  let usernames = req.body["usernames"];
  const clientId = +req.body["clientId"];
  const limit = +req.body["limit"];
  const comments = +req.body["comments"];
  const play_count = +req.body["play_count"];
  const days = +req.body["days"];
  const timeout = +req.body["timeout"];

  if (typeof usernames === "string") {
    usernames = JSON.parse(usernames);
  }

  if (!Array.isArray(usernames) || usernames.length === 0) {
    return res
      .status(400)
      .json({ error: "Invalid request: usernames[] обязательно" });
  }

  if (!clientId) {
    return res
      .status(400)
      .json({ error: "Invalid request: clientId обязательно" });
  }

  try {
    const flow = async () => {
      const now = Date.now(); // текущее время в мс
      const deltaDays = days * 24 * 60 * 60 * 1000; // days дней в мс

      const timestamp = now - deltaDays;

      const reels = await apifyService.runActor(
        apifyService.configureReelScrapper(
          usernames,
          limit,
          comments,
          play_count,
          timestamp,
          timeout,
        ),
      );

      // const CONCURRENCY_LIMIT = 16;
      // let index = 0;
      // let completed = 0;
      // let successCount = 0;
      // let failCount = 0;

      // const total = reels.length;
      // const results: any[] = [];

      // logger.info(
      //   `🚀 Начинаем обработку ${total} рилов (до ${CONCURRENCY_LIMIT} одновременно)...`,
      // );

      // // Функция для запуска одного задания
      // async function runNext() {
      //   if (index >= reels.length) return;

      //   const reel = reels[index++];
      //   const currentIndex = index;

      //   logger.info(
      //     `🎬 [${currentIndex}/${total}] Запуск обработки ${reel.code}...`,
      //   );

      //   try {
      //     const result = await apifyService.runActor(
      //       apifyService.configureReelTranscript(
      //         `https://instagram.com/p/${reel.code}`,
      //         timeout,
      //       ),
      //     );

      //     const text = (result as any)[0]?.result?.text ?? "";
      //     successCount++;

      //     results.push({ ...reel, transcript: text });

      //     logger.info(
      //       `✅ [${currentIndex}/${total}] Готово (${((completed / total) * 100).toFixed(1)}%) — ${reel.code}`,
      //     );
      //     if (text) {
      //       logger.info(
      //         `🗣️ Пример: ${text.slice(0, 60).replace(/\n/g, " ")}...`,
      //       );
      //     }
      //   } catch (err: any) {
      //     failCount++;
      //     logger.error(
      //       `❌ [${currentIndex}/${total}] Ошибка при обработке ${reel.code}:`,
      //       err.message,
      //     );
      //     results.push({ ...reel, transcript: null });
      //   }

      //   completed++;
      //   const percent = ((completed / total) * 100).toFixed(1);
      //   logger.info(
      //     `📊 Прогресс: ${completed}/${total} (${percent}%) | ✅ ${successCount} | ❌ ${failCount}`,
      //   );

      //   // запускаем следующее после завершения
      //   await runNext();
      // }

      // // Запускаем максимум N задач одновременно
      // const workers = Array(CONCURRENCY_LIMIT).fill(null).map(runNext);
      // await Promise.all(workers);

      // 3. Сохраняем результат в новый файл
      logger.info("\n🎉 Все рилы обработаны!");
      logger.info("💾 Результаты сохранены в dataset_with_transcripts.json");

      const sheetUrl = await sheetService.createCsv(
        reels,
        `./public/${clientId}/${new Date().getTime()}/Результаты.csv`,
      );

      await salebotService.sendParsingSuccessWebhook(
        clientId,
        sheetUrl,
        reels.length,
      );
    };

    flow();

    res.status(200).json({ status: "Parsing started" });
  } catch (err) {
    logger.error("❌ Ошибка при запуске парсинга:", err);
    await salebotService.sendServerErrorWebhook(clientId);
    res.status(500).json({ error: "Failed to start parsing", message: err });
  }
});

export default parseRouter;
