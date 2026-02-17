-- Add CHECK constraints for Data Integrity

-- Children: Gender must be M or F
ALTER TABLE "children" ADD CONSTRAINT "chk_gender_valid" 
  CHECK (gender IN ('M', 'F'));

-- Children: Blood type validation (nullable)
ALTER TABLE "children" ADD CONSTRAINT "chk_blood_type_valid" 
  CHECK (blood_type IS NULL OR blood_type IN ('A', 'B', 'AB', 'O', 'UNKNOWN'));

-- Sessions: Weight validation (0-200 kg)
ALTER TABLE "sessions" ADD CONSTRAINT "chk_weight_valid" 
  CHECK (weight IS NULL OR (weight > 0 AND weight < 200));

-- Sessions: Height validation (0-250 cm)
ALTER TABLE "sessions" ADD CONSTRAINT "chk_height_valid" 
  CHECK (height IS NULL OR (height > 0 AND height < 250));

-- Sessions: Temperature validation (30-45 C)
ALTER TABLE "sessions" ADD CONSTRAINT "chk_temperature_valid" 
  CHECK (temperature IS NULL OR (temperature >= 30 AND temperature <= 45));

-- Sessions: Heart Rate validation (0-300 bpm)
ALTER TABLE "sessions" ADD CONSTRAINT "chk_heart_rate_valid" 
  CHECK ("heart_rate" IS NULL OR ("heart_rate" >= 0 AND "heart_rate" <= 300));

-- Sessions: Noise Level validation (non-negative)
ALTER TABLE "sessions" ADD CONSTRAINT "chk_noise_level_valid" 
  CHECK ("noise_level" IS NULL OR "noise_level" >= 0);
