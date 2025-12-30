import amqp from 'amqplib';
import type { ChannelModel } from 'amqplib';
import dotenv from 'dotenv';

export default class ConnectionFactory {
    
    private connection: ChannelModel | null = null;

    constructor() {
        dotenv.config({quiet: true});
    }

    public async create(): Promise<ChannelModel> {
        if (!this.connection) {
            this.connection = await amqp.connect({
                hostname: process.env.RABBITMQ_HOSTNAME,
                port: Number(process.env.RABBITMQ_HOSTNAME),
                username: process.env.RABBITMQ_USERNAME,
                password: process.env.RABBITMQ_PASSWORD
            });
        }

        return this.connection;
    }
}