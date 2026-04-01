-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birth_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
    "birth_time" TEXT NOT NULL,
    "birth_city" TEXT NOT NULL,
    "birth_latitude" DOUBLE PRECISION NOT NULL,
    "birth_longitude" DOUBLE PRECISION NOT NULL,
    "timezone_id" TEXT NOT NULL,
    "utc_datetime" TIMESTAMP(3) NOT NULL,
    "julian_day" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "birth_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "natal_charts" (
    "id" UUID NOT NULL,
    "birth_profile_id" UUID NOT NULL,
    "order_id" UUID,
    "planetary_positions" JSONB NOT NULL,
    "house_cusps" JSONB NOT NULL,
    "aspects" JSONB NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "natal_charts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interpretive_texts" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "planet" TEXT NOT NULL,
    "sign" TEXT,
    "house" INTEGER,
    "aspect_type" TEXT,
    "transit_planet" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interpretive_texts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" DOUBLE PRECISION NOT NULL,
    "mp_payment_id" TEXT,
    "mp_preference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_brl" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transit_reports" (
    "id" UUID NOT NULL,
    "birth_profile_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "transit_date" TIMESTAMP(3) NOT NULL,
    "active_transits" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transit_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geocoding_cache" (
    "id" UUID NOT NULL,
    "query_normalized" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "formatted_address" TEXT NOT NULL,
    "timezone_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geocoding_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_type_key" ON "products"("type");

-- CreateIndex
CREATE UNIQUE INDEX "geocoding_cache_query_normalized_key" ON "geocoding_cache"("query_normalized");

-- AddForeignKey
ALTER TABLE "birth_profiles" ADD CONSTRAINT "birth_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "natal_charts" ADD CONSTRAINT "natal_charts_birth_profile_id_fkey" FOREIGN KEY ("birth_profile_id") REFERENCES "birth_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "natal_charts" ADD CONSTRAINT "natal_charts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit_reports" ADD CONSTRAINT "transit_reports_birth_profile_id_fkey" FOREIGN KEY ("birth_profile_id") REFERENCES "birth_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit_reports" ADD CONSTRAINT "transit_reports_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
