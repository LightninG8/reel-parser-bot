import axios from 'axios';
import { ENV } from '../config';

export const salebotService = {
    sendParsingSuccessWebhook(clientId: number, sheetUrl: string, count: number) {
        return axios.post(`https://chatter.salebot.pro/api/${ENV.SALEBOT_KEY}/callback`, {
            client_id: clientId,
            sheetUrl,
            message: 'parsing_ended',
            count,
        });
    },
    sendParsingProgressWebhook(clientId: number, countProgress: number) {
        return axios.post(`https://chatter.salebot.pro/api/${ENV.SALEBOT_KEY}/callback`, {
            client_id: clientId,
            message: 'parsing_progress',
            countProgress
        });
    },
    sendParsingErrorWebhook(clientId: number) {
        return axios.post(`https://chatter.salebot.pro/api/${ENV.SALEBOT_KEY}/callback`, {
            client_id: clientId,
            message: 'parsing_error',
        });
    },

    sendServerErrorWebhook(clientId: number) {
        return axios.post(`https://chatter.salebot.pro/api/${ENV.SALEBOT_KEY}/callback`, {
            client_id: clientId,
            message: 'server_error',
        });
    },
};
