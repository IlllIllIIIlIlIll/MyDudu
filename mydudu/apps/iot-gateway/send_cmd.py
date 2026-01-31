import os
import json
import ssl
import paho.mqtt.client as mqtt
import time

# Credentials from main.py / default
BROKER = os.getenv("MQTT_BROKER_HOST", "bb0e76e054dc460f8192d811442bb936.s1.eu.hivemq.cloud")
PORT = int(os.getenv("MQTT_PORT", 8883))
USERNAME = os.getenv("MQTT_USER", "mydudu")
PASSWORD = os.getenv("MQTT_PASS", "DoaAyahRestu1bu")
# Devices to target
TARGET_DEVICES = ["MD-0001", "MDX-0001"]

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"Connected to MQTT Broker: {BROKER}")
        
        # Construct payload
        payload = {
            "cmd": "START",
            "childId": 3,
            "parentId": 5,
            "name": "Simulated Child"
        }
        payload_str = json.dumps(payload)
        
        for device_uuid in TARGET_DEVICES:
            topic = f"dudu/v1/dev/{device_uuid}/command"
            print(f"Publishing to {topic}...")
            client.publish(topic, payload_str)
            print(f"Payload sent to {device_uuid}")
        
        # Wait a bit to ensure potential QB/Delivery
        time.sleep(2)
        client.disconnect()
    else:
        print(f"Failed to connect, return code {rc}")

def main():
    client = mqtt.Client()
    client.username_pw_set(USERNAME, PASSWORD)
    
    # Enable TLS
    client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS)
    
    client.on_connect = on_connect

    print(f"Connecting to {BROKER}:{PORT}...")
    try:
        client.connect(BROKER, PORT, 60)
        client.loop_forever()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()
