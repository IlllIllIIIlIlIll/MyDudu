import os
import json
import ssl
import paho.mqtt.client as mqtt
import time

# Credentials
BROKER = os.getenv("MQTT_BROKER_HOST", "bb0e76e054dc460f8192d811442bb936.s1.eu.hivemq.cloud")
PORT = int(os.getenv("MQTT_PORT", 8883))
USERNAME = os.getenv("MQTT_USER", "mydudu")
PASSWORD = os.getenv("MQTT_PASS", "DoaAyahRestu1bu")
DEVICE_UUID = "MDX-0001"
TOPIC = f"dudu/v1/dev/{DEVICE_UUID}/telemetry"

def create_client(client_id):
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id)
    client.username_pw_set(USERNAME, PASSWORD)
    client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS)
    return client

def main():
    print("--- STARTING SPLIT-MERGE SIMULATION ---")
    
    # 1. Start Sensor Client
    sensor_client = create_client("MDX-0001-Sensor")
    sensor_client.connect(BROKER, PORT, 60)
    sensor_client.loop_start()
    
    # Payload 1: Sensor Data (Height, Temp, HR, Noise)
    # Using Child 3 / Parent 5 as validated before
    payload_sensor = {
        "deviceUuid": DEVICE_UUID,
        "ts": int(time.time()),
        "childId": 3, 
        "parentId": 5, 
        "measurements": [
            { "sensorType": "HEIGHT", "value": 110.5 },
            { "sensorType": "TEMPERATURE", "value": 36.5 },
            { "sensorType": "HEART_RATE", "value": 95 },
            { "sensorType": "NOISE_LEVEL", "value": 50.2 }
        ]
    }
    
    print(f"[Sensor] Publishing Height/Temp/HR/Noise...")
    inf1 = sensor_client.publish(TOPIC, json.dumps(payload_sensor))
    inf1.wait_for_publish()
    print("Sensor Payload Sent.")
    sensor_client.loop_stop()
    sensor_client.disconnect()
    
    # Wait 2 seconds
    time.sleep(2)
    
    # 2. Start Scale Client
    scale_client = create_client("MDX-0001-Scale")
    scale_client.connect(BROKER, PORT, 60)
    scale_client.loop_start()
    
    # Payload 2: Weight Only (Time shifted slightly, same child)
    payload_scale = {
        "deviceUuid": DEVICE_UUID,
        "ts": int(time.time()) + 1,
        "childId": 3,
        "parentId": 5,
        "measurements": [
            { "sensorType": "WEIGHT", "value": 20.5 }
        ]
    }
    
    print(f"[Scale] Publishing Weight...")
    inf2 = scale_client.publish(TOPIC, json.dumps(payload_scale))
    inf2.wait_for_publish()
    print("Scale Payload Sent.")
    scale_client.loop_stop()
    scale_client.disconnect()
    
    print("--- SENT BOTH. CHECK DB FOR MERGED SESSION ---")

if __name__ == "__main__":
    main()
