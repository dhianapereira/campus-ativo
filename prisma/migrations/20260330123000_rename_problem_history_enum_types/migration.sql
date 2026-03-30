DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'HistoryAction'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'ProblemHistoryAction'
  ) THEN
    ALTER TYPE "public"."HistoryAction" RENAME TO "ProblemHistoryAction";
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'HistoryChangeField'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'ProblemHistoryChangeField'
  ) THEN
    ALTER TYPE "public"."HistoryChangeField" RENAME TO "ProblemHistoryChangeField";
  END IF;
END
$$;
