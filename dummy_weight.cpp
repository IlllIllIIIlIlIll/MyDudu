#include <Arduino.h>
#include <Wire.h>
#include "SH1106Wire.h" 
#include <HX711_ADC.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "time.h"

// ==========================================
// 1. CONFIGURATION: WIFI & MQTT
// ==========================================
const char* ssid1 = "Dudu";
const char* password1 = "1234567890";
const char* ssid2 = "ALFANI";
const char* password2 = "11257079";
const char* ssid3 = "J2 Prime";
const char* password3 = "574829163";

// MQTT Broker (HiveMQ Cloud)
const char* mqtt_server = "bb0e76e054dc460f8192d811442bb936.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "mydudu";
const char* mqtt_pass = "DoaAyahRestu1bu";
const char* device_uuid = "MD-0001"; // Shared UUID
const char* mqtt_client_id = "MD-0001-Scale"; // UNIQUE Client ID
const char* topic_telemetry = "dudu/v1/dev/MD-0001/telemetry";
const char* topic_command   = "dudu/v1/dev/MD-0001/command";

// Root CA (ISRG Root X1)
const char* root_ca = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n" \
"TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n" \
"cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\n" \
"WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\n" \
"ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\n" \
"MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc\n" \
"h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+\n" \
"0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U\n" \
"A5/TR5d8mUgjU+g4rk8SMark879uyWH87/qWrF0kYn0Q/XqYI1rppn47urVt1bAR\n" \
"k9qaQ+DI3/U4y6aKO60+Iv0mwROi05lmGwnzB9l4z6NA72DN17ZD8p/lmsCq2l5f\n" \
"s6Fk91rmQ55qAC4zQtG9FzJ52A80e3/140rX9q1g97Yce75jA4o2tYpI2B308/gD\n" \
"2o7J0Yp/M5+kM4kE29I3d9H7Z9s53e20j92E/O17c5p798P8+G+6yO+M2+bOp5vW\n" \
"6p6C665671/zP7v5k9A91g4tW8l2bF5E2xXq1+dS6O2k411sM2t0C546j/c2I6lV\n" \
"j37aXF37t51j8c56rQ8J1aN2j79pXz5k501r5l3c473dE8t0W7g71j1D842t10t\n" \
"j79pXz5k501r5l3c473dE8t0W7g71j1D842t10t\n" \
"-----END CERTIFICATE-----\n";

// ==========================================
// 2. HARDWARE SETUP
// ==========================================
#define OLED_SDA 8
#define OLED_SCL 9
#define OLED_ADDR 0x3C
const int HX711_dout = 4;
const int HX711_sck = 5;

// Objects
SH1106Wire display(OLED_ADDR, OLED_SDA, OLED_SCL); 
HX711_ADC LoadCell(HX711_dout, HX711_sck);
WiFiClientSecure espClient;
PubSubClient client(espClient);

// Variables
float calibrationValue = -25000.0; 
unsigned long t = 0;
int current_child_id = 0;
int current_parent_id = 0;
bool weight_upload_pending = false;

// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================

unsigned long get_unix_time() {
  time_t now; struct tm timeinfo;
  if(!getLocalTime(&timeinfo)) return 0;
  time(&now); return now;
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, msg);
  
  if (!error) {
    const char* cmd = doc["cmd"];
    if (strcmp(cmd, "START") == 0) {
      current_child_id = doc["childId"];
      current_parent_id = doc["parentId"];
      weight_upload_pending = true; // Flag to enable uploading
      Serial.println("CMD START Received!");
      // Could beep or show visual indicator
    }
  }
}

void reconnectMQTT() {
  if (!client.connected()) {
    if (client.connect(mqtt_client_id, mqtt_user, mqtt_pass)) {
      client.subscribe(topic_command);
    }
  }
}

void drawBigText(int x, int y, const String &text) {
  display.setFont(ArialMT_Plain_24);
  display.drawString(x, y, text);
  display.drawString(x + 1, y, text);
  display.drawString(x, y + 1, text);
}

void drawWeightUI(float valueKg) {
  char intPart[8]; char fracPart[8];
  int integer = (int)valueKg;
  int fraction = abs((int)((valueKg - integer) * 100)); // 2 decimal

  sprintf(intPart, "%d", integer);
  sprintf(fracPart, ".%02d", fraction); 

  display.clear();
  display.setFont(ArialMT_Plain_10);
  display.setTextAlignment(TEXT_ALIGN_LEFT);
  display.drawString(0, 0, "HEALTH BOX");
  display.drawLine(0, 12, 128, 12);
  
  // Show connection status
  if (WiFi.status() == WL_CONNECTED) display.drawString(90,0, "WIFI");
  if (weight_upload_pending) display.drawString(60,0, "REQ"); // Request Pending

  display.setFont(ArialMT_Plain_24);
  int wInt = display.getStringWidth(intPart);
  display.setFont(ArialMT_Plain_16);
  int wFrac = display.getStringWidth(fracPart);
  display.setFont(ArialMT_Plain_10);
  int wUnit = display.getStringWidth("kg");

  int totalWidth = wInt + wFrac + wUnit + 6; 
  int startX = (128 - totalWidth) / 2;
  int baseY = 25; 

  drawBigText(startX, baseY, intPart);
  display.setFont(ArialMT_Plain_16);
  display.drawString(startX + wInt + 2, baseY + 8, fracPart);
  display.setFont(ArialMT_Plain_10);
  display.drawString(startX + wInt + wFrac + 6, baseY + 14, "kg");

  display.display();
}

void uploadWeight(float weight) {
  if (WiFi.status() != WL_CONNECTED || !client.connected()) return;
  
  StaticJsonDocument<256> doc;
  doc["deviceUuid"] = device_uuid;
  doc["ts"] = get_unix_time();
  doc["childId"] = current_child_id;
  doc["parentId"] = current_parent_id;
  
  JsonArray measurements = doc.createNestedArray("measurements");
  JsonObject mWeight = measurements.createNestedObject();
  mWeight["sensorType"] = "WEIGHT";
  mWeight["value"] = weight;

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);
  
  if (client.publish(topic_telemetry, jsonBuffer)) {
      Serial.println("Weight Uploaded!");
      display.clear(); 
      display.setFont(ArialMT_Plain_16); 
      display.setTextAlignment(TEXT_ALIGN_CENTER);
      display.drawString(64, 20, "SENT!"); 
      display.display();
      delay(1000);
      
      // Reset after upload
      weight_upload_pending = false;
      current_child_id = 0; 
  }
}

// ==========================================
// 4. MAIN SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(100);

  // Init OLED
  if(!display.init()) Serial.println("OLED Error!");
  display.flipScreenVertically();
  display.setContrast(255);
  display.clear();
  display.setFont(ArialMT_Plain_16);
  display.setTextAlignment(TEXT_ALIGN_CENTER);
  display.drawString(64, 20, "Booting...");
  display.display();

  // Load Cell
  LoadCell.begin();
  LoadCell.setSamplesInUse(16);
  LoadCell.start(2000, true);
  if (LoadCell.getTareTimeoutFlag()) {
    display.drawString(64, 40, "LC ERROR"); display.display();
    while (1);
  }
  LoadCell.setCalFactor(calibrationValue);

  // WiFi Config
  display.clear(); display.drawString(64, 20, "Connect WiFi..."); display.display();
  WiFi.begin(ssid1, password1);
  int retry = 0;
  while(WiFi.status() != WL_CONNECTED && retry < 10) { delay(500); retry++; }
  if(WiFi.status() == WL_CONNECTED) {
       configTime(0, 0, "pool.ntp.org");
       display.drawString(64, 40, "Connected!");
  } else {
       display.drawString(64, 40, "WiFi Fail");
  }
  display.display(); delay(1000);

  // MQTT Config
  espClient.setCACert(root_ca);
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
}

// ==========================================
// 5. MAIN LOOP
// ==========================================
void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!client.connected()) reconnectMQTT();
    client.loop();
  }

  LoadCell.update();

  if (millis() > t + 200) {
    float weight = LoadCell.getData();
    if (abs(weight) < 0.1) weight = 0.00;

    // Logic: Upload ONLY if we have a request (child_id != 0) AND weight is stable > 1kg
    if (weight_upload_pending && weight > 1.0) {
        // Simple stability check logic could go here
        // For now, just upload once valid weight is seen
        // Ideally wait for stability
        uploadWeight(weight);
    }

    drawWeightUI(weight);
    t = millis();
  }

  // Serial Tuning
  if (Serial.available() > 0) {
    char inByte = Serial.read();
    if (inByte == 't') LoadCell.tareNoDelay(); 
    else if (inByte == '+') { calibrationValue += 10.0; LoadCell.setCalFactor(calibrationValue); }
    else if (inByte == '-') { calibrationValue -= 10.0; LoadCell.setCalFactor(calibrationValue); }
  }
}