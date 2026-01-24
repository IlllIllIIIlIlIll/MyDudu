import os
import time
import json
import random
from dotenv import load_dotenv
import paho.mqtt.client as mqtt

# Load environment variables
load_dotenv()

BROKER = os.getenv("MQTT_BROKER", "broker.hivemq.com")
PORT = int(os.getenv("MQTT_PORT", 1883))
TOPIC = os.getenv("MQTT_TOPIC", "mydudu/telemetry")
DEVICE_UUID = os.getenv("DEVICE_UUID", "simulated-device-001")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"Connected to MQTT Broker: {BROKER}")
    else:
        print(f"Failed to connect, return code {rc}")

def main():
    client = mqtt.Client()
    client.on_connect = on_connect

    # Enable TLS if using port 8883 (standard for secure MQTT)
    if PORT == 8883:
        client.tls_set()

    print(f"Connecting to {BROKER}:{PORT}...")
    try:
        client.connect(BROKER, PORT, 60)
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    client.loop_start()

    print(f"Starting simulation for device: {DEVICE_UUID}")
    
    try:
        while True:
            # Simulate sensor data
            payload = {
                "device_uuid": DEVICE_UUID,
                "timestamp": int(time.time()),
                "data": {
                    "weight": round(random.uniform(3.0, 15.0), 2),
                    "height": round(random.uniform(45.0, 100.0), 2),
                    "temp": round(random.uniform(36.0, 37.5), 1),
                    "battery": random.randint(20, 100)
                }
            }
            
            payload_str = json.dumps(payload)
            client.publish(TOPIC, payload_str)
            print(f"Published to {TOPIC}: {payload_str}")
            
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("Simulation stopped")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
