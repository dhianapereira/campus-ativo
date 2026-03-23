-- Remove o snapshot legado do nome da localização.
-- Algumas bases ficaram com essa coluna antiga ainda marcada como NOT NULL,
-- o que quebra a criação de problemas porque a aplicação hoje persiste
-- apenas location_id.
ALTER TABLE "public"."problems" DROP COLUMN IF EXISTS "location_name";
