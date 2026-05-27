-- =============================================================
-- Migración manual: campos nuevos de CRM (Lead)
-- Aplicar en Supabase → SQL Editor (Run).
-- Equivale a `prisma db push` para los cambios de schema.prisma.
-- Es idempotente y seguro sobre datos existentes (usa defaults).
-- =============================================================

-- 1) Nuevo valor de fuente: Cartelería
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'CARTELERIA';

-- 2) Nuevos enums
DO $$ BEGIN
  CREATE TYPE "LeadRelation" AS ENUM ('PROPIETARIO', 'CLIENTE', 'COLEGA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "LeadOperation" AS ENUM ('COMPRAVENTA', 'ALQUILER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "LeadPriority" AS ENUM ('ALTA', 'MEDIA', 'BAJA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3) Nuevas columnas en la tabla leads (con defaults, no rompe filas existentes)
ALTER TABLE "leads"
  ADD COLUMN IF NOT EXISTS "relation"   "LeadRelation"     NOT NULL DEFAULT 'CLIENTE',
  ADD COLUMN IF NOT EXISTS "operations" "LeadOperation"[]  NOT NULL DEFAULT ARRAY[]::"LeadOperation"[],
  ADD COLUMN IF NOT EXISTS "priority"   "LeadPriority"     NOT NULL DEFAULT 'MEDIA';
