-- ============================================================
-- Controle Operacional — Supabase Schema
-- Execute this in the Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== SETORES =====
CREATE TABLE IF NOT EXISTS setores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== CARGOS =====
CREATE TABLE IF NOT EXISTS cargos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== FISCAIS =====
CREATE TABLE IF NOT EXISTS fiscais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    matricula TEXT,
    username TEXT,
    password TEXT,
    setor_id UUID REFERENCES setores(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== FUNCIONARIOS =====
CREATE TABLE IF NOT EXISTS funcionarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    matricula TEXT,
    cargo_id UUID REFERENCES cargos(id) ON DELETE SET NULL,
    fiscal_id UUID REFERENCES fiscais(id) ON DELETE SET NULL,
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== SYS_USERS (vistoria, almoxarifado, sesmt, dp) =====
CREATE TABLE IF NOT EXISTS sys_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('vistoria', 'almoxarifado', 'sesmt', 'dp')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== MATERIAIS =====
CREATE TABLE IF NOT EXISTS materiais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    unidade TEXT,
    categoria TEXT,
    estoque_minimo NUMERIC DEFAULT 0,
    estoque_atual NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== SOLICITACOES =====
CREATE TABLE IF NOT EXISTS solicitacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fiscal_id UUID REFERENCES fiscais(id) ON DELETE SET NULL,
    fiscal_nome TEXT,
    items JSONB DEFAULT '[]',
    status TEXT DEFAULT 'pendente',
    observacao TEXT,
    vistoria_approval TEXT,
    vistoria_date TIMESTAMPTZ,
    vistoria_obs TEXT,
    almox_approval TEXT,
    almox_date TIMESTAMPTZ,
    almox_obs TEXT,
    qtd_liberada JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== PRESENCAS =====
CREATE TABLE IF NOT EXISTS presencas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    status TEXT
);
CREATE INDEX IF NOT EXISTS idx_presencas_date ON presencas(date);
CREATE INDEX IF NOT EXISTS idx_presencas_func ON presencas(funcionario_id);

-- ===== CONTROLE_CONTRATO =====
CREATE TABLE IF NOT EXISTS controle_contrato (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== ROCADEIRAS =====
CREATE TABLE IF NOT EXISTS rocadeiras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patrimonio TEXT,
    modelo TEXT,
    status TEXT,
    setor_id UUID REFERENCES setores(id) ON DELETE SET NULL,
    fiscal_id UUID REFERENCES fiscais(id) ON DELETE SET NULL,
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== METAS_ROCADEIRAS =====
CREATE TABLE IF NOT EXISTS metas_rocadeiras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setor_id UUID REFERENCES setores(id) ON DELETE CASCADE,
    meta NUMERIC DEFAULT 0
);

-- ===== TIPOS_SERVICO =====
CREATE TABLE IF NOT EXISTS tipos_servico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TEMAS_DDS =====
CREATE TABLE IF NOT EXISTS temas_dds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tema TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== REGISTROS_DDS =====
CREATE TABLE IF NOT EXISTS registros_dds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fiscal_id UUID REFERENCES fiscais(id) ON DELETE SET NULL,
    fiscal_nome TEXT,
    date TEXT NOT NULL,
    tema_id UUID,
    tema_nome TEXT,
    tipo_servico TEXT,
    turno TEXT,
    participantes JSONB DEFAULT '[]',
    observacao TEXT,
    fotos JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dds_date ON registros_dds(date);
CREATE INDEX IF NOT EXISTS idx_dds_fiscal ON registros_dds(fiscal_id);

-- ===== BANCO_HORAS =====
CREATE TABLE IF NOT EXISTS banco_horas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricula TEXT,
    nome TEXT NOT NULL,
    funcao TEXT,
    saldo NUMERIC DEFAULT 0,
    imported_at TIMESTAMPTZ DEFAULT now()
);

-- ===== APP_CONFIG (presenca_config, permissions_config, etc) =====
CREATE TABLE IF NOT EXISTS app_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB DEFAULT '{}'
);

-- Insert default config rows
INSERT INTO app_config (key, value) VALUES ('presenca_config', 'null') ON CONFLICT (key) DO NOTHING;
INSERT INTO app_config (key, value) VALUES ('permissions_config', 'null') ON CONFLICT (key) DO NOTHING;

-- ===== RLS POLICIES =====
-- For simplicity (no Supabase Auth used), allow full access via anon key
-- In production, you should restrict this further

ALTER TABLE setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sys_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE controle_contrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocadeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_rocadeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE temas_dds ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_dds ENABLE ROW LEVEL SECURITY;
ALTER TABLE banco_horas ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon role (since we handle auth in app layer)
CREATE POLICY "Allow all for anon" ON setores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON cargos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON fiscais FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON funcionarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON sys_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON materiais FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON solicitacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON presencas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON controle_contrato FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON rocadeiras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON metas_rocadeiras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON tipos_servico FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON temas_dds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON registros_dds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON banco_horas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON app_config FOR ALL USING (true) WITH CHECK (true);
