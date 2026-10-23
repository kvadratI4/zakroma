-- =============================================================================
-- Закрома — РЕАЛИЗОВАННАЯ схема БД (результат миграций Alembic). Не редактировать руками.
--
-- Источник истины — миграции backend/alembic/versions. Файл пересоздаётся в задаче,
-- которая меняет схему (после `uv run alembic upgrade head` на dev-БД):
--   docker compose -f deploy/docker-compose.dev.yml exec -T db sh -c \
--     'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --schema-only --no-owner --no-privileges --restrict-key=zakroma' \
--     > docs/db/schema.sql   # затем вернуть эту шапку
--
-- Проект ещё не реализованных таблиц — docs/db/schema_design.sql (переносится в миграции
-- по задачам T-010, T-011, T-020, T-031…).
-- =============================================================================

--
-- PostgreSQL database dump
--

\restrict zakroma

-- Dumped from database version 18.6 (Debian 18.6-1.pgdg13+2)
-- Dumped by pg_dump version 18.6 (Debian 18.6-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: zk_search_norm(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.zk_search_norm(t text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    RETURN lower(replace(replace(t, 'ё'::text, 'е'::text), 'Ё'::text, 'Е'::text));


--
-- Name: zk_search_fold(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.zk_search_fold(t text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    RETURN translate(public.zk_search_norm(t), 'оэяы'::text, 'аеаи'::text);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- PostgreSQL database dump complete
--

\unrestrict zakroma
