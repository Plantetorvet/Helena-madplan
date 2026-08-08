-- Tilføj nye kolonner til produkter-tabellen
ALTER TABLE produkter ADD COLUMN IF NOT EXISTS enumre jsonb DEFAULT '[]';
ALTER TABLE produkter ADD COLUMN IF NOT EXISTS markering text DEFAULT 'ingen';

-- Opdater unique constraint så produkter uden barcode også kan gemmes unikt
ALTER TABLE produkter DROP CONSTRAINT IF EXISTS produkter_familie_id_barcode_key;
ALTER TABLE produkter ADD CONSTRAINT produkter_familie_id_navn_key UNIQUE (familie_id, navn);
