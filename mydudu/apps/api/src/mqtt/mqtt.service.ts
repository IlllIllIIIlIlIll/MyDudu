import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService, SystemLogAction } from '../system-logs/system-logs.service';
import { NotificationService } from '../notifications/notifications.service';
import { NutritionService } from '../telemetry/nutrition.service';
import { NotifType } from '@prisma/client';
// SensorType enum removed from Prisma schema, so we define it here or just check strings
// But we still need to validate/map inputs.

@Injectable()
export class MqttService implements OnModuleInit {
    private client: mqtt.MqttClient;
    private readonly logger = new Logger(MqttService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly systemLogsService: SystemLogsService,
        private readonly notificationService: NotificationService,
        private readonly nutritionService: NutritionService
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
            connectTimeout: 30000,
            reconnectPeriod: 1000,
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
            await this.notificationService.notifyAdmin(`Payload invalid dari device (UUID: ${payload.deviceUuid || 'Unknown'})`);
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

        // 3. Replay Protection & Session Merging Strategy
        const payloadTime = new Date(ts * 1000);

        // Strategy: "Split-Device Merging"
        // Look for an existing session for this CHILD that is IN_PROGRESS and created recently (< 1 hour).
        // If found, we MERGE the new data into it.
        // If not found, we ensure this isn't an old replay (replay protection) and create new.

        const existingSession = await this.prisma.session.findFirst({
            where: {
                childId: Number(childId),
                status: 'IN_PROGRESS',
                recordedAt: {
                    gte: new Date(Date.now() - 60 * 60 * 1000) // Last 1 hour
                }
            },
            orderBy: { recordedAt: 'desc' }, // Get the latest one
            include: { device: true } // Just in case we want to log which device started it
        });

        // If merged session found, we skip replay protection check because we WANT to add to it.
        // If NO merged session found, then we do replay protection against CLOSED sessions.
        if (!existingSession) {
            const lastClosedSession = await this.prisma.session.findFirst({
                where: { deviceId: device.id },
                orderBy: { recordedAt: 'desc' }
            });

            if (lastClosedSession && lastClosedSession.recordedAt && payloadTime <= lastClosedSession.recordedAt) {
                this.logger.warn(`Dropping replay/old data. Payload: ${payloadTime}, Last: ${lastClosedSession.recordedAt}`);
                return;
            }
        }

        // 4. Transform Measurements -> Session Columns
        // Initialize session data object
        const sessionData: any = {
            sessionUuid: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            childId: Number(childId),
            deviceId: device.id,
            recordedAt: payloadTime,
            // status: 'COMPLETE', // REMOVED: Keep IN_PROGRESS to allow merging from second device
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
                case 'BATTERY':
                    if (val < 20) {
                        // Find operator assigned to this device/posyandu? 
                        // For now, notify Admin as fallback or just log. 
                        // Requirement says "notifyOperator". 
                        // We don't have operatorID immediately here, but we can look up via device -> posyandu -> users.
                        // For simplicity in this step, I'll assume we can get it later or just notify via simpler method.
                        // Actually, let's fetch device's posyandu users.
                        // Updated Path: Device -> Posyandu -> Village -> Users
                        // 1. Get Device -> Posyandu -> VillageId
                        // Wait, we already have `device` which is basic findUnique. We need to fetch relation if not present.
                        // But `device` is constrained. Let's do a fresh find.

                        const deviceWithLoc = await this.prisma.device.findUnique({
                            where: { id: device.id },
                            include: { posyandu: true }
                        });

                        if (deviceWithLoc?.posyandu?.villageId) {
                            const posyanduUsers = await this.prisma.user.findMany({
                                where: { villageId: deviceWithLoc.posyandu.villageId }
                            });
                            for (const u of posyanduUsers) {
                                await this.notificationService.notifyOperator(u.id, `Baterai alat lemah (${val}%)`, NotifType.SYSTEM);
                            }
                        }
                    }
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

        const resolvedWeight = sessionData.weight ?? existingSession?.weight ?? null;
        const resolvedHeight = sessionData.height ?? existingSession?.height ?? null;
        const resolvedTemperature = sessionData.temperature ?? existingSession?.temperature ?? null;
        const meetsMeasurementMinimum = resolvedWeight !== null && resolvedHeight !== null && resolvedTemperature !== null;
        const measurementCompleted = existingSession
            ? Boolean(existingSession.measurementCompleted || meetsMeasurementMinimum)
            : meetsMeasurementMinimum;
        const measurementCompletedAt = measurementCompleted
            ? existingSession?.measurementCompletedAt ?? new Date()
            : null;

        sessionData.measurementCompleted = measurementCompleted;
        sessionData.measurementCompletedAt = measurementCompletedAt;

        // 5. Save Data (Create or Update)
        try {
            let session;

            if (existingSession) {
                // UPDATE existing session
                // We only update fields that are defined in `sessionData`.
                // Note: sessionData has `sessionUuid`, `deviceId`, etc. we might not want to overwrite UUID.

                // Remove fixed fields from update payload
                delete sessionData.sessionUuid;
                delete sessionData.recordedAt; // Keep original time
                delete sessionData.deviceId;   // Keep original device ID (or update if we want to track last writer?)
                delete sessionData.childId;
                delete sessionData.status;

                session = await this.prisma.session.update({
                    where: { id: existingSession.id },
                    data: sessionData
                });

                this.logger.log(`Session MERGED/UPDATED for ${deviceUuid}. ID: ${session.id}`);
            } else {
                // CREATE new session
                session = await this.prisma.session.create({
                    data: sessionData
                });
                this.logger.log(`Session CREATED for ${deviceUuid} at ${payloadTime}`);
            }

            await this.systemLogsService.logEvent(
                existingSession ? SystemLogAction.SESSION_UPDATED : SystemLogAction.SESSION_CREATED,
                {
                    sessionId: session.id,
                    childId: session.childId
                }, undefined, deviceUuid
            );

            // Trigger Nutrition Analysis & Potential Alerts
            await this.nutritionService.computeStatus(session.id);

        } catch (dbError) {
            this.logger.error('Failed to save session to DB', dbError);
        }
    }
}
