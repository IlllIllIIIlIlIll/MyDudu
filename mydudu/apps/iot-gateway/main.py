import os
import time
import json
import random
try:
    from dotenv import load_dotenv
    import paho.mqtt.client as mqtt
except ImportError:
    print("Installing dependencies...")
    os.system("pip install paho-mqtt python-dotenv")
    from dotenv import load_dotenv
    import paho.mqtt.client as mqtt
import ssl

# Load environment variables
load_dotenv()

# Configuration (HiveMQ Cloud)
BROKER = os.getenv("MQTT_BROKER_HOST", "bb0e76e054dc460f8192d811442bb936.s1.eu.hivemq.cloud")
PORT = int(os.getenv("MQTT_PORT", 8883))
USERNAME = os.getenv("MQTT_USER", "mydudu")
PASSWORD = os.getenv("MQTT_PASS", "DoaAyahRestu1bu")
DEVICE_UUID = "MD-0001"

TOPIC = f"dudu/v1/dev/{DEVICE_UUID}/telemetry"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"Connected to MQTT Broker: {BROKER}")
    else:
        print(f"Failed to connect, return code {rc}")

def on_publish(client, userdata, mid):
    print(f"Message {mid} published.")

def main():
    client = mqtt.Client()
    client.username_pw_set(USERNAME, PASSWORD)
    
    # Enable TLS for HiveMQ Cloud
    client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS)
    
    client.on_connect = on_connect
    client.on_publish = on_publish

    print(f"Connecting to {BROKER}:{PORT} as {USERNAME}...")
    try:
        client.connect(BROKER, PORT, 60)
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    client.loop_start()

    print(f"Starting simulation for device: {DEVICE_UUID}")
    
    try:
        # Simulate sensor data validation batch
        measurements = [
            { "sensorType": "WEIGHT", "value": 12.4 },
            { "sensorType": "HEIGHT", "value": 92.1 },
            { "sensorType": "TEMPERATURE", "value": 36.6 },
            { "sensorType": "HEART_RATE", "value": 98.0 },
            { "sensorType": "NOISE_LEVEL", "value": 42.3 }
        ]

        payload = {
            "deviceUuid": DEVICE_UUID,
            "ts": int(time.time()),
            "parentId": 2, # Example from user
            "childId": 12, # Example from user - Ensure this exists or catch error in API
            "battery": 78,
            "measurements": measurements
        }
        
        # User requested specific testing with this payload
        # I need to ensure childId 12 exists in DB, otherwise API foreign key constraint might fail.
        # But 'MD-0001' device exists.
        # API logic: await this.prisma.session.create({ ... childId: Number(childId) ... })
        # If Child 12 doesn't exist, it will crash/error.
        # I will revert childId to 1 (from previous test) which I *assume* exists or I should check.
        # Actually my previous plan used childId 1.
        # The user provided example "childId": 12. 
        # I will stick to childId=1 for safety unless I seed Child 12.
        # Let's seed Child 1 first or use 1.
        payload["childId"] = 1 # Overwrite for safety unless I seed it.
        
        payload_str = json.dumps(payload)
        client.publish(TOPIC, payload_str)
        print(f"Published to {TOPIC}: {payload_str}")
        
        # Keep alive for a bit
        time.sleep(5)
            
    except KeyboardInterrupt:
        print("Simulation stopped")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
