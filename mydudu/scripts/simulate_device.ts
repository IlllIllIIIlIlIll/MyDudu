import * as mqtt from 'mqtt';

// HiveMQ Credentials (same as backend)
const HOST = 'bb0e76e054dc460f8192d811442bb936.s1.eu.hivemq.cloud';
const PORT = 8883;
const USER = 'mydudu';
const PASS = 'DoaAyahRestu1bu';
const PROTOCOL = 'mqtts';

const CONNECT_URL = `${PROTOCOL}://${HOST}:${PORT}`;

// Simulation Config
const DEVICE_UUID = 'MD0001'; // Default or change as needed
const CHILD_ID = 1; // Change to a valid child ID in your DB
const PARENT_ID = 1; // Change to a valid parent ID in your DB

const client = mqtt.connect(CONNECT_URL, {
    username: USER,
    password: PASS,
    clientId: `sim-${Math.random().toString(16).substr(2, 8)}`,
    rejectUnauthorized: true,
});

client.on('connect', () => {
    console.log(`Connected to HiveMQ at ${HOST}`);
    simulateTelemetry();
});

client.on('error', (err) => {
    console.error('MQTT Error:', err);
    process.exit(1);
});

function simulateTelemetry() {
    const topic = `dudu/v1/dev/${DEVICE_UUID}/telemetry`;

    // Payload structure based on mqtt.service.ts
    const payload = {
        deviceUuid: DEVICE_UUID,
        ts: Math.floor(Date.now() / 1000),
        childId: CHILD_ID,
        parentId: PARENT_ID,
        measurements: [
            { sensorType: 'WEIGHT', value: 12.5 },
            { sensorType: 'HEIGHT', value: 85.0 },
            { sensorType: 'TEMPERATURE', value: 36.6 },
            { sensorType: 'HEART_RATE', value: 95 },
            { sensorType: 'NOISE_LEVEL', value: 45.0 },
            { sensorType: 'BATTERY', value: 85 }
        ]
    };

    console.log(`Publishing to ${topic}...`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
        if (err) {
            console.error('Publish error:', err);
        } else {
            console.log('Message published successfully!');
        }

        // Close after publishing
        setTimeout(() => {
            client.end();
            console.log('Disconnected');
        }, 1000);
    });
}
