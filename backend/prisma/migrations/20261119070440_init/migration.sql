-- CreateTable
CREATE TABLE "movies" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "release_year" INTEGER NOT NULL,
    "runtime_minutes" INTEGER NOT NULL,
    "watched" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "movies_title_not_blank" CHECK (btrim("title") <> ''),
    CONSTRAINT "movies_release_year_check" CHECK ("release_year" BETWEEN 1888 AND 2100),
    CONSTRAINT "movies_runtime_minutes_check" CHECK ("runtime_minutes" BETWEEN 1 AND 300)
);

-- CreateTable
CREATE TABLE "movie_prerequisites" (
    "movie_id" UUID NOT NULL,
    "prerequisite_id" UUID NOT NULL,

    CONSTRAINT "movie_prerequisites_pkey" PRIMARY KEY ("movie_id","prerequisite_id"),
    CONSTRAINT "movie_prerequisites_not_self" CHECK ("movie_id" <> "prerequisite_id")
);

-- CreateTable
CREATE TABLE "cinemas" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cinemas_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cinemas_name_not_blank" CHECK (btrim("name") <> '')
);

-- CreateTable
CREATE TABLE "cinema_bundles" (
    "cinema_id" UUID NOT NULL,
    "size" INTEGER NOT NULL,

    CONSTRAINT "cinema_bundles_pkey" PRIMARY KEY ("cinema_id","size"),
    CONSTRAINT "cinema_bundles_size_check" CHECK ("size" BETWEEN 1 AND 500)
);

-- CreateIndex
CREATE UNIQUE INDEX "movies_title_key" ON "movies"("title");

-- CreateIndex
CREATE INDEX "movie_prerequisites_prerequisite_id_idx" ON "movie_prerequisites"("prerequisite_id");

-- CreateIndex
CREATE UNIQUE INDEX "cinemas_name_key" ON "cinemas"("name");

-- AddForeignKey
ALTER TABLE "movie_prerequisites" ADD CONSTRAINT "movie_prerequisites_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_prerequisites" ADD CONSTRAINT "movie_prerequisites_prerequisite_id_fkey" FOREIGN KEY ("prerequisite_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cinema_bundles" ADD CONSTRAINT "cinema_bundles_cinema_id_fkey" FOREIGN KEY ("cinema_id") REFERENCES "cinemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A cinema must end each transaction with 1-10 normalized bundle rows.
-- The deferred trigger permits creating the cinema and its bundles atomically.
CREATE FUNCTION "check_cinema_bundle_count"() RETURNS TRIGGER AS $$
DECLARE
    checked_cinema_id UUID;
    bundle_count INTEGER;
BEGIN
    IF TG_TABLE_NAME = 'cinemas' THEN
        checked_cinema_id := COALESCE(NEW."id", OLD."id");
    ELSE
        checked_cinema_id := COALESCE(NEW."cinema_id", OLD."cinema_id");
    END IF;

    -- A deleted cinema no longer needs bundles. Locking an existing parent also
    -- serializes concurrent bundle changes for the same cinema.
    PERFORM 1 FROM "cinemas" WHERE "id" = checked_cinema_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT COUNT(*) INTO bundle_count
    FROM "cinema_bundles"
    WHERE "cinema_id" = checked_cinema_id;

    IF bundle_count < 1 OR bundle_count > 10 THEN
        RAISE EXCEPTION 'Cinema must have between 1 and 10 bundle sizes'
            USING ERRCODE = '23514';
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "cinemas_bundle_count_check"
AFTER INSERT OR UPDATE ON "cinemas"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "check_cinema_bundle_count"();

CREATE CONSTRAINT TRIGGER "cinema_bundles_count_check"
AFTER INSERT OR UPDATE OR DELETE ON "cinema_bundles"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "check_cinema_bundle_count"();
