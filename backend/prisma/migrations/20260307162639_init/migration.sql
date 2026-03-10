-- CreateEnum
CREATE TYPE "blog_posts_status" AS ENUM ('approved', 'rejected', 'pending');

-- CreateEnum
CREATE TYPE "doctor_review_status" AS ENUM ('approved', 'rejected', 'pending', 'revoked');

-- CreateEnum
CREATE TYPE "chat_role" AS ENUM ('user', 'assistant');

-- CreateEnum
CREATE TYPE "blogs_category" AS ENUM ('Heart', 'Lifestyle', 'Nutrition', 'Fitness', 'General');

-- CreateEnum
CREATE TYPE "registration_type" AS ENUM ('Full Registration', 'Provisional Registration', 'TPC Number');

-- CreateEnum
CREATE TYPE "sex" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "providers" AS ENUM ('local', 'google');

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "blog_posts_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" BIGINT,
    "reviewed_at" TIMESTAMPTZ(6),
    "category" "blogs_category" DEFAULT 'General',

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "user_id" BIGINT NOT NULL,
    "specialization" VARCHAR(255) NOT NULL,
    "years_of_experience" INTEGER NOT NULL,
    "doctor_license_url" TEXT NOT NULL,
    "status" "doctor_review_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" BIGINT,
    "reviewed_at" TIMESTAMPTZ(6),
    "identification_number" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(40) NOT NULL,
    "graduated_from" VARCHAR(255) NOT NULL,
    "place_of_practice" VARCHAR(255) NOT NULL,
    "type_of_registration" "registration_type" NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "health" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" INTEGER NOT NULL,
    "cp" INTEGER NOT NULL,
    "trestbps" INTEGER NOT NULL,
    "chol" INTEGER NOT NULL,
    "fbs" INTEGER NOT NULL,
    "restecg" INTEGER NOT NULL,
    "thalach" INTEGER NOT NULL,
    "exang" INTEGER NOT NULL,
    "oldpeak" REAL NOT NULL,
    "slope" INTEGER NOT NULL,
    "ca" INTEGER NOT NULL,
    "thal" INTEGER NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_prediction" (
    "id" BIGSERIAL NOT NULL,
    "health_id" BIGINT NOT NULL,
    "model_version" VARCHAR(255) NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "band" TEXT NOT NULL,

    CONSTRAINT "health_prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "hashed_password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "age" INTEGER,
    "sex" "sex",
    "emergency_contact_email" VARCHAR(255),
    "verification_token" TEXT,
    "provider" "providers" NOT NULL,
    "isverified" BOOLEAN DEFAULT false,
    "token_expires_at" TIMESTAMPTZ(6),
    "emergency_contact_token" TEXT,
    "emergency_contact_isverified" BOOLEAN DEFAULT false,
    "emergency_contact_token_expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_roles" (
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,

    CONSTRAINT "users_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "chat_id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "role" "chat_role" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "citations" JSONB,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("chat_id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "session_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "health_prediction_health_id_unique" ON "health_prediction"("health_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "health" ADD CONSTRAINT "health_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "health_prediction" ADD CONSTRAINT "health_prediction_health_id_fkey" FOREIGN KEY ("health_id") REFERENCES "health"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("session_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
