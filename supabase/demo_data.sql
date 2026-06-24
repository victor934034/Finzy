-- ============================================================
-- DADOS DE DEMONSTRAÇÃO — Finzy IA
-- ============================================================
-- INSTRUÇÕES:
-- 1. Crie uma conta no app (http://localhost:5173) primeiro
-- 2. No Supabase SQL Editor, substitua o valor abaixo pelo UUID real:
--    SELECT id FROM auth.users LIMIT 5;
-- 3. Execute este script inteiro
-- ============================================================

DO $$
DECLARE
  uid UUID := (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1);
  -- Se quiser um usuário específico: uid UUID := 'cole-aqui-o-uuid';
BEGIN

-- ============================================================
-- TRANSAÇÕES — últimos 6 meses
-- ============================================================
INSERT INTO public.transactions (user_id, tipo, valor, categoria, descricao, data) VALUES
-- Junho 2026
(uid, 'receita',  4800.00, 'salário',       'Salário junho',               '2026-06-05'),
(uid, 'receita',   650.00, 'freelance',     'Projeto React - cliente',     '2026-06-12'),
(uid, 'despesa',   950.00, 'moradia',       'Aluguel junho',               '2026-06-01'),
(uid, 'despesa',   380.00, 'alimentação',   'Supermercado Semanal',        '2026-06-03'),
(uid, 'despesa',   220.00, 'alimentação',   'Restaurantes',                '2026-06-10'),
(uid, 'despesa',   145.00, 'transporte',    'Gasolina',                    '2026-06-08'),
(uid, 'despesa',    98.00, 'saúde',         'Farmácia',                    '2026-06-14'),
(uid, 'despesa',   189.00, 'lazer',         'Cinema + jantar',             '2026-06-15'),
(uid, 'despesa',    59.90, 'assinaturas',   'Spotify + Netflix',           '2026-06-01'),
(uid, 'despesa',   250.00, 'educação',      'Curso online',                '2026-06-18'),

-- Maio 2026
(uid, 'receita',  4800.00, 'salário',       'Salário maio',                '2026-05-05'),
(uid, 'receita',   320.00, 'freelance',     'Correção de bugs - app',      '2026-05-20'),
(uid, 'despesa',   950.00, 'moradia',       'Aluguel maio',                '2026-05-01'),
(uid, 'despesa',   410.00, 'alimentação',   'Supermercado',                '2026-05-04'),
(uid, 'despesa',   175.00, 'alimentação',   'iFood + restaurantes',        '2026-05-12'),
(uid, 'despesa',   130.00, 'transporte',    'Gasolina',                    '2026-05-07'),
(uid, 'despesa',   320.00, 'saúde',         'Consulta médica + exames',    '2026-05-16'),
(uid, 'despesa',    59.90, 'assinaturas',   'Spotify + Netflix',           '2026-05-01'),
(uid, 'despesa',   480.00, 'vestuário',     'Roupas temporada',            '2026-05-22'),

-- Abril 2026
(uid, 'receita',  4800.00, 'salário',       'Salário abril',               '2026-04-05'),
(uid, 'receita',  1200.00, 'freelance',     'Desenvolvimento landing page', '2026-04-10'),
(uid, 'despesa',   950.00, 'moradia',       'Aluguel abril',               '2026-04-01'),
(uid, 'despesa',   390.00, 'alimentação',   'Supermercado',                '2026-04-03'),
(uid, 'despesa',   200.00, 'alimentação',   'Restaurantes',                '2026-04-15'),
(uid, 'despesa',   140.00, 'transporte',    'Gasolina + estacionamento',   '2026-04-09'),
(uid, 'despesa',    59.90, 'assinaturas',   'Spotify + Netflix',           '2026-04-01'),
(uid, 'despesa',   350.00, 'lazer',         'Viagem fim de semana',        '2026-04-20'),
(uid, 'despesa',   180.00, 'educação',      'Livros técnicos',             '2026-04-25'),

-- Março 2026
(uid, 'receita',  4800.00, 'salário',       'Salário março',               '2026-03-05'),
(uid, 'despesa',   950.00, 'moradia',       'Aluguel março',               '2026-03-01'),
(uid, 'despesa',   420.00, 'alimentação',   'Supermercado',                '2026-03-04'),
(uid, 'despesa',   165.00, 'alimentação',   'Restaurantes',                '2026-03-11'),
(uid, 'despesa',   125.00, 'transporte',    'Gasolina',                    '2026-03-06'),
(uid, 'despesa',    59.90, 'assinaturas',   'Spotify + Netflix',           '2026-03-01'),
(uid, 'despesa',   230.00, 'saúde',         'Academia 3 meses',            '2026-03-08'),
(uid, 'despesa',   780.00, 'eletrônicos',   'Teclado mecânico',            '2026-03-19'),

-- Fevereiro 2026
(uid, 'receita',  4800.00, 'salário',       'Salário fevereiro',           '2026-02-05'),
(uid, 'receita',   500.00, 'outros',        'Venda de itens usados',       '2026-02-14'),
(uid, 'despesa',   950.00, 'moradia',       'Aluguel fevereiro',           '2026-02-01'),
(uid, 'despesa',   360.00, 'alimentação',   'Supermercado',                '2026-02-03'),
(uid, 'despesa',   195.00, 'alimentação',   'Restaurantes + delivery',     '2026-02-10'),
(uid, 'despesa',   110.00, 'transporte',    'Gasolina',                    '2026-02-07'),
(uid, 'despesa',    59.90, 'assinaturas',   'Spotify + Netflix',           '2026-02-01'),
(uid, 'despesa',   280.00, 'lazer',         'Carnaval',                    '2026-02-28'),

-- Janeiro 2026
(uid, 'receita',  4800.00, 'salário',       'Salário janeiro',             '2026-01-05'),
(uid, 'receita',  4800.00, 'salário',       '13º salário (parcela 2)',     '2026-01-07'),
(uid, 'despesa',   950.00, 'moradia',       'Aluguel janeiro',             '2026-01-01'),
(uid, 'despesa',   430.00, 'alimentação',   'Supermercado',                '2026-01-04'),
(uid, 'despesa',   155.00, 'alimentação',   'Restaurantes',                '2026-01-12'),
(uid, 'despesa',   130.00, 'transporte',    'Gasolina',                    '2026-01-08'),
(uid, 'despesa',    59.90, 'assinaturas',   'Spotify + Netflix',           '2026-01-01'),
(uid, 'despesa',  1200.00, 'impostos',      'IPVA',                        '2026-01-15'),
(uid, 'despesa',   890.00, 'viagem',        'Viagem de réveillon',         '2026-01-03');

-- ============================================================
-- GASTOS FIXOS
-- ============================================================
INSERT INTO public.gastos_fixos (user_id, descricao, valor, categoria, dia_vencimento, frequencia, ativo) VALUES
(uid, 'Aluguel',       950.00, 'moradia',      1,  'mensal',  true),
(uid, 'Netflix',        45.90, 'assinaturas',  1,  'mensal',  true),
(uid, 'Spotify',        14.00, 'assinaturas',  1,  'mensal',  true),
(uid, 'Academia',       80.00, 'saúde',        10, 'mensal',  true),
(uid, 'Internet',      100.00, 'moradia',      15, 'mensal',  true),
(uid, 'Plano de saúde',250.00, 'saúde',        5,  'mensal',  true),
(uid, 'IPVA',         1200.00, 'impostos',     15, 'anual',   true);

-- ============================================================
-- INVESTIMENTOS
-- ============================================================
INSERT INTO public.investments (user_id, nome, tipo, valor_investido, valor_atual, data_inicio) VALUES
(uid, 'Tesouro Selic 2027', 'renda_fixa',   5000.00,  5420.00, '2025-01-15'),
(uid, 'CDB Nubank 120%',    'renda_fixa',   3000.00,  3215.00, '2025-03-01'),
(uid, 'ITSA4',              'ações',        2500.00,  2890.00, '2024-08-10'),
(uid, 'MXRF11 FII',         'fii',          1800.00,  1950.00, '2025-06-01'),
(uid, 'Bitcoin',            'cripto',        800.00,   920.00, '2025-09-20'),
(uid, 'Fundo DI Bradesco',  'fundo',        4200.00,  4385.00, '2024-11-01');

-- ============================================================
-- METAS
-- ============================================================
INSERT INTO public.metas (user_id, titulo, tipo, valor_alvo, valor_atual, prazo, descricao, concluida) VALUES
(uid, 'Reserva de emergência', 'reserva_emergencia', 18000.00, 11500.00, '2026-12-31',
     'Meta: 3 meses de despesas. Guardando R$500/mês.',                false),
(uid, 'Viagem para Europa',    'viagem',              12000.00,  3200.00, '2027-07-01',
     'Paris + Roma, 15 dias. Guardando R$600/mês.',                    false),
(uid, 'Notebook novo',         'compra',               4500.00,  4500.00, NULL,
     'MacBook Air M2',                                                  true),
(uid, 'Quitar dívida cartão',  'quitar_divida',        2800.00,  2800.00, '2026-03-01',
     'Parcelamento de eletrônicos',                                     true);

-- ============================================================
-- NOTIFICAÇÕES DE EXEMPLO
-- ============================================================
INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, lida) VALUES
(uid, 'Meta atingida! 🎯',
     'Parabéns! Você concluiu a meta "Notebook novo". Continue assim!',
     'sucesso', false),
(uid, 'Gastos acima da média',
     'Seus gastos com alimentação este mês (R$ 600) estão 28% acima da sua média dos últimos 3 meses (R$ 469).',
     'alerta', false),
(uid, 'Dica da FinIA 💡',
     'Com base no seu histórico, você tem potencial de investir R$ 800/mês. Já considerou aumentar seus aportes?',
     'info', true);

END $$;
