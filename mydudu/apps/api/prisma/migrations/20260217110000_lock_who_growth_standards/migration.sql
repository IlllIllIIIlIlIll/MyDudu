-- Create a function that raises an exception
CREATE OR REPLACE FUNCTION prevent_who_standards_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'WHO growth standards are read-only reference data. Modification prevented by trigger.';
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the table for INSERT, UPDATE, DELETE
CREATE TRIGGER trg_prevent_who_update
BEFORE INSERT OR UPDATE OR DELETE ON "who_growth_standards"
FOR EACH ROW EXECUTE FUNCTION prevent_who_standards_modification();
