ALTER TABLE public.pro_fuel_list
  ADD COLUMN IF NOT EXISTS "recordType" text NOT NULL DEFAULT 'fuel',
  ADD COLUMN IF NOT EXISTS "electricityFee" numeric,
  ADD COLUMN IF NOT EXISTS "electricityKwh" numeric;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pro_fuel_list_record_type_check'
  ) THEN
    ALTER TABLE public.pro_fuel_list
      ADD CONSTRAINT pro_fuel_list_record_type_check
      CHECK ("recordType" IN ('fuel', 'electricity'));
  END IF;
END $$;
