#include <Wire.h>
#include <SPI.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_INA219.h>
#include <HTTPClient.h> // Added for API Integration

// WiFi credentials
const char* ssid = "ESP32_TEST";
const char* password = "12345678";

// --- API CONFIGURATION ---
// Use your laptop's LAN IP here. The ESP32 must send data to the backend,
// not to the Vite frontend. The frontend reads the live data from the backend.
const char* serverPath = "http://10.248.103.223:8080/api/dashboard/energy-ingest";
const char* deviceId = "esp32-site-001";
const char* sourceType = "aggregate";
const char* deviceApiKey = "";
unsigned long lastPostTime = 0;
const unsigned long postInterval = 5000; // Push data every 5 seconds

WebServer server(80);

// OLED SPI pins
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_MOSI 23
#define OLED_CLK 18
#define OLED_DC 16
#define OLED_CS 5
#define OLED_RST 4

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, OLED_MOSI, OLED_CLK, OLED_DC, OLED_RST, OLED_CS);
Adafruit_INA219 ina219;

float voltage = 0, current = 0, power = 0, energy_mWh = 0;
unsigned long lastTime = 0;

float sanitizeReading(float value, float minValue, float maxValue) {
  if (!isfinite(value) || value < minValue || value > maxValue) {
    return 0;
  }
  return value;
}

void handleRoot() {
  String page = "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1.0'><meta http-equiv='refresh' content='2'/><title>AI Smart Meter</title><style>body{font-family:sans-serif; text-align:center; background:#f4f4f4;} .card{background:white; padding:20px; border-radius:10px; display:inline-block; margin-top:50px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);}</style></head><body>";
  page += "<div class='card'><h1>Smart Meter Dashboard</h1>";
  page += "<h3>Voltage: " + String(voltage, 2) + " V</h3>";
  page += "<h3>Current: " + String(current, 1) + " mA</h3>";
  page += "<h3>Power: " + String(power, 1) + " mW</h3>";
  page += "<h3>Energy: " + String(energy_mWh, 2) + " mWh</h3></div></body></html>";
  server.send(200, "text/html", page);
}

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  ina219.begin();
  display.begin(SSD1306_SWITCHCAPVCC);
  
  // Welcome Animation
  display.clearDisplay();
  display.stopscroll();
  display.setTextColor(WHITE);
  display.setTextSize(1);
  display.setCursor(30, 10);
  display.println("AI-POWERED");
  display.setTextSize(2);
  display.setCursor(5, 30);
  display.println("SMART METER");
  display.display();
  display.startscrollright(0x00, 0x07);
  delay(4000); 
  display.stopscroll();

  // Connect WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Connecting WiFi...");
  display.display();

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi connected.");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("Posting to: ");
  Serial.println(serverPath);

  server.on("/", handleRoot);
  server.begin();
  lastTime = millis();
}

void loop() {
  // 1. Read Data
  voltage = ina219.getBusVoltage_V();
  current = ina219.getCurrent_mA();
  power = ina219.getPower_mW();

  voltage = sanitizeReading(voltage, 0, 400);
  current = sanitizeReading(current, 0, 100000);
  power = sanitizeReading(power, 0, 100000000);

  unsigned long now = millis();
  energy_mWh += power * ((now - lastTime) / 3600000.0);
  lastTime = now;

  Serial.print("Voltage: ");
  Serial.println(voltage, 2);
  Serial.print("Current: ");
  Serial.println(current, 1);
  Serial.print("Power: ");
  Serial.println(power, 1);
  Serial.print("Energy: ");
  Serial.println(energy_mWh, 2);

  // 2. API Integration: Push to EcoGrid Dashboard
  if (now - lastPostTime > postInterval) {
    if (WiFi.status() == WL_CONNECTED) {
      if (voltage == 0 && current == 0 && power == 0 && energy_mWh == 0) {
        Serial.println("Skipping POST: readings are all zero/invalid.");
        lastPostTime = now;
        return;
      }

      HTTPClient http;
      http.setConnectTimeout(3000); // 3 second timeout
      http.setTimeout(5000);
      
      Serial.println("Attempting to connect to: " + String(serverPath));
      http.begin(serverPath);
      http.addHeader("Content-Type", "application/json");

      String httpRequestData = "{\"deviceId\":\"" + String(deviceId) + "\",\"sourceType\":\"" + String(sourceType) + "\",\"apiKey\":\"" + String(deviceApiKey) + "\",\"voltage\":" + String(voltage, 2) + ",\"current\":" + String(current, 1) + ",\"power\":" + String(power, 1) + ",\"energy\":" + String(energy_mWh, 2) + "}";

      int httpResponseCode = http.POST(httpRequestData);
      
      if (httpResponseCode > 0) {
        Serial.print("Data Sent! Response: ");
        Serial.println(httpResponseCode);
        String body = http.getString();
        if (body.length() > 0) {
          Serial.println("Backend reply: " + body);
        }
      } else {
        Serial.print("Error Code: ");
        Serial.println(httpResponseCode);
        Serial.println("Check: 1. Laptop IP, 2. Firewall, 3. Backend is running");
      }
      
      http.end();
    } else {
      Serial.println("WiFi disconnected. Reconnecting...");
      WiFi.disconnect();
      WiFi.begin(ssid, password);
    }
    lastPostTime = now;
  }

  // 3. Update OLED
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("--- LIVE DATA ---");
  display.setCursor(0, 15);
  display.print("V: "); display.print(voltage, 2); display.println(" V");
  display.print("I: "); display.print(current, 1); display.println(" mA");
  display.print("P: "); display.print(power, 1);   display.println(" mW");
  display.print("E: "); display.print(energy_mWh, 2); display.println(" mWh");
  if (WiFi.status() == WL_CONNECTED) {
    display.setCursor(0, 55);
    display.print("IP: "); display.print(WiFi.localIP());
  }
  display.display();

  server.handleClient();
  delay(200); 
}
