import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService, SystemLogAction } from '../system-logs/system-logs.service';
// SensorType enum removed from Prisma schema, so we define it here or just check strings
// But we still need to validate/map inputs.

@Injectable()
export class MqttService implements OnModuleInit {
    private client: mqtt.MqttClient;
    private readonly logger = new Logger(MqttService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly systemLogsService: SystemLogsService
    ) { }

    onModuleInit() {
        this.connect();
    }

    private connect() {
        // HiveMQ Cloud Credentials
        // Host: bb0e76e054dc460f8192d811442bb936.s1.eu.hivemq.cloud
        // Port: 8883
        // TLS: enabled
        const protocol = 'mqtts';
        const host = process.env.MQTT_BROKER_HOST || 'bb0e76e054dc460f8192d811442bb936.s1.eu.hivemq.cloud';
        const port = Number(process.env.MQTT_PORT) || 8883;
        const username = process.env.MQTT_USER || 'mydudu';
        const password = process.env.MQTT_PASS || 'DoaAyahRestu1bu';

        const connectUrl = `${protocol}://${host}:${port}`;

        this.client = mqtt.connect(connectUrl, {
            username,
            password,
            clientId: `api-${Math.random().toString(16).substr(2, 8)}`,
            rejectUnauthorized: true, // Standard TLS for HiveMQ Cloud
        });

        this.client.on('connect', () => {
            this.logger.log(`Connected to MQTT Broker at ${host}`);
            // Subscribe to simplified topic structure
            this.client.subscribe('dudu/v1/dev/+/telemetry', (err) => {
                if (err) {
                    this.logger.error('Failed to subscribe', err);
                } else {
                    this.logger.log('Subscribed to dudu/v1/dev/+/telemetry');
                }
            });
        });

        this.client.on('message', (topic, message) => {
            this.handleMessage(topic, message);
        });

        this.client.on('error', (err) => {
            this.logger.error('MQTT Error', err);
        });
    }

    private async handleMessage(topic: string, message: Buffer) {
        try {
            const payload = JSON.parse(message.toString());
            this.logger.log(`Received payload from ${topic}`);

            await this.processTelemetry(payload);
        } catch (error) {
            this.logger.error('Error processing message', error);
        }
    }

    private async processTelemetry(payload: any) {
        // 1. Validation: Basic Structure
        if (!payload.deviceUuid || !payload.measurements || !Array.isArray(payload.measurements)) {
            this.logger.warn('Invalid payload structure');
            return;
        }

        const { deviceUuid, ts, parentId, childId, measurements } = payload;

        // 2. Validation: Device Existence
        const device = await this.prisma.device.findUnique({
            where: { deviceUuid },
        });

        if (!device) {
            this.logger.warn(`Device not found: ${deviceUuid}`);
            return;
        }

        // 3. Replay Protection
        const payloadTime = new Date(ts * 1000);

        const lastSession = await this.prisma.session.findFirst({
            where: { deviceId: device.id },
            orderBy: { recordedAt: 'desc' }
        });

        if (lastSession && lastSession.recordedAt && payloadTime <= lastSession.recordedAt) {
            this.logger.warn(`Dropping replay/old data. Payload: ${payloadTime}, Last: ${lastSession.recordedAt}`);
            return;
        }

        // 4. Transform Measurements -> Session Columns
        // Initialize session data object
        const sessionData: any = {
            sessionUuid: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            childId: Number(childId),
            deviceId: device.id,
            recordedAt: payloadTime,
            status: 'COMPLETE',
        };

        let hasData = false;

        for (const m of measurements) {
            let type = m.sensorType;
            const val = m.value;

            switch (type) {
                case 'WEIGHT':
                    sessionData.weight = val;
                    hasData = true;
                    break;
                case 'HEIGHT':
                    sessionData.height = val;
                    hasData = true;
                    break;
                case 'TEMPERATURE':
                case 'TEMP':
                    sessionData.temperature = val;
                    hasData = true;
                    break;
                // case 'HEAD_CIRC':
                //     sessionData.headCirc = val;
                //     hasData = true;
                //     break;
                // case 'ARM_CIRC':
                //     sessionData.armCirc = val;
                //     hasData = true;
                //     break;
                case 'HEART_RATE':
                    sessionData.heartRate = val;
                    hasData = true;
                    break;
                case 'NOISE_LEVEL':
                    sessionData.noiseLevel = val;
                    hasData = true;
                    break;
                // case 'OXY':
                //     sessionData.oxy = val;
                //     hasData = true;
                //     break;
                default:
                    this.logger.warn(`Ignored unknown sensor type: ${type}`);
            }
        }

        if (!hasData) {
            this.logger.warn('No valid measurement data mapped to columns');
            return;
        }

        // 5. Save Data
        try {
            const session = await this.prisma.session.create({
                data: sessionData
            });

            this.logger.log(`Session saved for ${deviceUuid} at ${payloadTime}`);

            await this.systemLogsService.logEvent(SystemLogAction.SESSION_CREATED, {
                sessionId: session.id,
                childId: session.childId
            }, undefined, deviceUuid);

        } catch (dbError) {
            this.logger.error('Failed to save session to DB', dbError);
        }
    }
}
