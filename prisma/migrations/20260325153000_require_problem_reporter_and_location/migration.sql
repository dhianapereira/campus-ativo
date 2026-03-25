DO $$
DECLARE
  system_user_id text;
BEGIN
  SELECT id
  INTO system_user_id
  FROM users
  WHERE email = 'sistema@ifal-arapiraca.edu.br'
  LIMIT 1;

  IF EXISTS (SELECT 1 FROM problems WHERE reporter_id IS NULL) THEN
    IF system_user_id IS NULL THEN
      RAISE EXCEPTION 'System user sistema@ifal-arapiraca.edu.br must exist before this migration';
    END IF;

    UPDATE problems
    SET reporter_id = system_user_id
    WHERE reporter_id IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM problems WHERE location_id IS NULL) THEN
    RAISE EXCEPTION 'All problems must have a location before this migration';
  END IF;
END $$;

ALTER TABLE problems
ALTER COLUMN reporter_id SET NOT NULL;

ALTER TABLE problems
ALTER COLUMN location_id SET NOT NULL;

ALTER TABLE problems
DROP CONSTRAINT IF EXISTS problems_reporter_id_fkey;

ALTER TABLE problems
DROP CONSTRAINT IF EXISTS problems_location_id_fkey;

ALTER TABLE problems
ADD CONSTRAINT problems_reporter_id_fkey
FOREIGN KEY (reporter_id) REFERENCES users(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE problems
ADD CONSTRAINT problems_location_id_fkey
FOREIGN KEY (location_id) REFERENCES locations(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;
