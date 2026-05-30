-- ====================================================================
-- PAINEL DM — Portal Jacaré Tucujú
-- Schema MySQL 5.7+ / MariaDB 10.3+
-- Charset: utf8mb4 (Unicode completo, incluindo emojis)
-- ====================================================================

SET NAMES utf8mb4;
SET time_zone = '-03:00';

-- ====================================================================
-- USUÁRIOS
-- ====================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(120) NOT NULL,
  email        VARCHAR(160) NOT NULL UNIQUE,
  senha        VARCHAR(255) NOT NULL,
  tipo         ENUM('admin','colaborador') NOT NULL DEFAULT 'colaborador',
  status       CHAR(1) NOT NULL DEFAULT 'S',
  foto         VARCHAR(255) DEFAULT NULL,
  telefone     VARCHAR(40)  DEFAULT NULL,
  cidade       VARCHAR(100) DEFAULT NULL,
  estado       CHAR(2)      DEFAULT NULL,
  sobre        TEXT         DEFAULT NULL,
  permissoes   JSON         DEFAULT NULL,
  criado_em    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME    DEFAULT NULL,
  criado_por   INT          DEFAULT NULL,
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- CATEGORIAS (editorias)
-- ====================================================================
CREATE TABLE IF NOT EXISTS categorias (
  slug   VARCHAR(80)  PRIMARY KEY,
  label  VARCHAR(120) NOT NULL,
  cor    VARCHAR(20)  DEFAULT '#999999',
  ordem  INT          DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- MUNICÍPIOS
-- ====================================================================
CREATE TABLE IF NOT EXISTS municipios (
  slug      VARCHAR(80)  PRIMARY KEY,
  label     VARCHAR(120) NOT NULL,
  populacao INT          DEFAULT 0,
  descricao TEXT         DEFAULT NULL,
  imagem    VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- NOTÍCIAS
-- ====================================================================
CREATE TABLE IF NOT EXISTS noticias (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(180) NOT NULL UNIQUE,
  titulo          VARCHAR(255) NOT NULL,
  lide            TEXT         DEFAULT NULL,
  conteudo        MEDIUMTEXT   DEFAULT NULL,
  imagem          VARCHAR(500) DEFAULT NULL,
  categoria       VARCHAR(80)  DEFAULT NULL,
  municipio       VARCHAR(80)  DEFAULT NULL,
  autor           VARCHAR(120) DEFAULT NULL,
  autor_avatar    VARCHAR(500) DEFAULT NULL,
  data            DATETIME     NOT NULL,
  tags            JSON         DEFAULT NULL,
  destaque        TINYINT(1)   NOT NULL DEFAULT 0,
  views           INT          NOT NULL DEFAULT 0,
  tempo_leitura   INT          NOT NULL DEFAULT 1,
  criado_em       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  criado_por      INT          DEFAULT NULL,
  atualizado_em   DATETIME     DEFAULT NULL,
  atualizado_por  INT          DEFAULT NULL,
  removido_em     DATETIME     DEFAULT NULL,
  removido_por    INT          DEFAULT NULL,
  KEY idx_categoria (categoria),
  KEY idx_municipio (municipio),
  KEY idx_data (data),
  KEY idx_destaque (destaque),
  KEY idx_removido (removido_em),
  FULLTEXT KEY ft_busca (titulo, lide)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- ANÚNCIOS (slots publicitários)
-- ====================================================================
CREATE TABLE IF NOT EXISTS anuncios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nome            VARCHAR(120) NOT NULL,
  tipo            VARCHAR(80)  NOT NULL,
  tamanho         VARCHAR(40)  NOT NULL,
  posicao         VARCHAR(255) DEFAULT NULL,
  paginas         JSON         DEFAULT NULL,
  ativo           TINYINT(1)   NOT NULL DEFAULT 0,
  criativo_imagem VARCHAR(500) DEFAULT NULL,
  criativo_html   TEXT         DEFAULT NULL,
  criativo_titulo VARCHAR(255) DEFAULT NULL,
  destino         VARCHAR(500) DEFAULT NULL,
  periodo_inicio  DATETIME     DEFAULT NULL,
  periodo_fim     DATETIME     DEFAULT NULL,
  impressoes      INT          NOT NULL DEFAULT 0,
  cliques         INT          NOT NULL DEFAULT 0,
  removido_em     DATETIME     DEFAULT NULL,
  KEY idx_tipo (tipo),
  KEY idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- VÍDEOS
-- ====================================================================
CREATE TABLE IF NOT EXISTS videos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  titulo      VARCHAR(255) NOT NULL,
  thumb       VARCHAR(500) DEFAULT NULL,
  duracao     VARCHAR(20)  DEFAULT NULL,
  youtube_id  VARCHAR(20)  NOT NULL,
  categoria   VARCHAR(80)  DEFAULT NULL,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  removido_em DATETIME     DEFAULT NULL,
  KEY idx_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- ENQUETES (id é slug textual)
-- ====================================================================
CREATE TABLE IF NOT EXISTS enquetes (
  id        VARCHAR(120) PRIMARY KEY,
  pergunta  TEXT         NOT NULL,
  opcoes    JSON         NOT NULL,
  ativa     TINYINT(1)   NOT NULL DEFAULT 1,
  criado_em DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- CLASSIFICADOS
-- ====================================================================
CREATE TABLE IF NOT EXISTS classificados (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  titulo      VARCHAR(255) NOT NULL,
  preco       DECIMAL(12,2) NOT NULL DEFAULT 0,
  imagem      VARCHAR(500) DEFAULT NULL,
  cidade      VARCHAR(120) DEFAULT NULL,
  categoria   VARCHAR(120) DEFAULT NULL,
  telefone    VARCHAR(40)  DEFAULT NULL,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  removido_em DATETIME     DEFAULT NULL,
  KEY idx_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS classificados_categorias (
  slug  VARCHAR(80)  PRIMARY KEY,
  label VARCHAR(120) NOT NULL,
  cor   VARCHAR(20)  DEFAULT '#999999',
  icon  TEXT         DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- COLUNAS / BLOGS
-- ====================================================================
CREATE TABLE IF NOT EXISTS colunas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  colunista   VARCHAR(160) NOT NULL,
  avatar      VARCHAR(500) DEFAULT NULL,
  titulo      VARCHAR(255) NOT NULL,
  slug        VARCHAR(220) NOT NULL,
  data        DATETIME     NOT NULL,
  conteudo    MEDIUMTEXT   DEFAULT NULL,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  removido_em DATETIME     DEFAULT NULL,
  UNIQUE KEY uk_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- COMENTÁRIOS
-- ====================================================================
CREATE TABLE IF NOT EXISTS comentarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  noticia_slug  VARCHAR(180) NOT NULL,
  autor         VARCHAR(160) NOT NULL,
  email         VARCHAR(160) DEFAULT NULL,
  texto         TEXT         NOT NULL,
  status        ENUM('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
  criado_em     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  moderado_em   DATETIME     DEFAULT NULL,
  moderado_por  INT          DEFAULT NULL,
  removido_em   DATETIME     DEFAULT NULL,
  KEY idx_noticia (noticia_slug),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- PÁGINAS ESTÁTICAS
-- ====================================================================
CREATE TABLE IF NOT EXISTS paginas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(180) NOT NULL UNIQUE,
  titulo        VARCHAR(255) NOT NULL,
  conteudo      MEDIUMTEXT   DEFAULT NULL,
  visivel_menu  TINYINT(1)   NOT NULL DEFAULT 0,
  ordem         INT          DEFAULT 0,
  atualizado_em DATETIME     DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- PLUGINS (marketplace)
-- ====================================================================
CREATE TABLE IF NOT EXISTS plugins (
  id             VARCHAR(80)  PRIMARY KEY,
  nome           VARCHAR(160) NOT NULL,
  descricao      TEXT         DEFAULT NULL,
  categoria      VARCHAR(80)  DEFAULT NULL,
  tipo           ENUM('gratis','premium') NOT NULL DEFAULT 'gratis',
  instalado      TINYINT(1)   NOT NULL DEFAULT 0,
  versao         VARCHAR(20)  DEFAULT '1.0.0',
  ultima_versao  VARCHAR(20)  DEFAULT '1.0.0',
  icone          VARCHAR(60)  DEFAULT NULL,
  cor            VARCHAR(20)  DEFAULT NULL,
  config         JSON         DEFAULT NULL,
  instalado_em   DATETIME     DEFAULT NULL,
  atualizado_em  DATETIME     DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- CONFIG (key-value para portal, redes, whatsapp, tema, layout, etc.)
-- ====================================================================
CREATE TABLE IF NOT EXISTS config (
  chave         VARCHAR(80) PRIMARY KEY,
  valor         JSON        NOT NULL,
  atualizado_em DATETIME    DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- ACESSOS (analytics simples, diário)
-- ====================================================================
CREATE TABLE IF NOT EXISTS acessos (
  data            DATE PRIMARY KEY,
  views           INT NOT NULL DEFAULT 0,
  visitantes      INT NOT NULL DEFAULT 0,
  registrado_em   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- SEEDS — dados mínimos
-- ====================================================================

-- Editorias padrão
INSERT IGNORE INTO categorias (slug, label, cor, ordem) VALUES
  ('politica',   'Política',   '#003366', 1),
  ('policia',    'Polícia',    '#8b0000', 2),
  ('economia',   'Economia',   '#00695c', 3),
  ('esportes',   'Esportes',   '#1b5e20', 4),
  ('cultura',    'Cultura',    '#6a1b9a', 5),
  ('municipios', 'Municípios', '#e65100', 6);

-- Slots de publicidade
INSERT IGNORE INTO anuncios (id, nome, tipo, tamanho, posicao, paginas, ativo) VALUES
  (1, 'Pop-up Publicitário', 'interstitial',     '580x400', 'Overlay ao carregar a home (delay 3s)', '["home"]', 0),
  (2, 'Super Banner',        'super-banner',     '970x150', 'Abaixo do hero / manchete principal',    '["home"]', 0),
  (3, 'Half Page',           'half-page',        '300x600', 'Sidebar — abaixo das categorias',        '["home","noticia","categoria"]', 0),
  (4, 'Medium Rectangle',    'medium-rectangle', '300x250', 'Sidebar — abaixo da enquete',            '["home","noticia","categoria"]', 0),
  (5, 'Billboard',           'billboard',        '970x90',  'Entre municípios e vídeos',              '["home"]', 0);

-- Plugins disponíveis
INSERT IGNORE INTO plugins (id, nome, descricao, categoria, tipo, icone, cor) VALUES
  ('isocial-whatsapp',  'iSocial Post WhatsApp',          'Compartilhe suas notícias em grupos do WhatsApp automaticamente.', 'redes-sociais',  'gratis', 'whatsapp',  '#25d366'),
  ('isocial-instagram', 'iSocial Post Instagram',         'Publique suas notícias em suas páginas do Instagram.',             'redes-sociais',  'gratis',  'instagram', '#e1306c'),
  ('vocaliza',          'Vocaliza',                       'Torne o seu site inclusivo adicionando um player.',                 'acessibilidade', 'gratis', 'voz',       '#9b59b6'),
  ('pdf-incorporado',   'PDF Incorporado',                'Exiba seus arquivos em PDF direto na notícia.',                     'conteudo',       'gratis',  'pdf',       '#d93025'),
  ('aviso-lgpd',        'Aviso de Política de Privacidade','Insira um aviso sobre a Política de Privacidade do seu site.',     'legal',          'gratis',  'cadeado',   '#5a5a5a'),
  ('auto-post',         'Auto Post',                      'Publique notícias automaticamente no seu site.',                    'automacao',      'gratis', 'auto-post', '#f08c00'),
  ('gera-post',         'Gera Post',                      'Gere artes das notícias para compartilhar nas redes sociais.',      'criativo',       'gratis',  'arte',      '#2185d0'),
  ('google-amp',        'Google AMP Cache',               'Versão AMP (Google) de suas notícias.',                              'performance',    'gratis',  'raio',      '#1a73e8'),
  ('protecao-copia',    'Proteção contra cópia',          'Dificulte a cópia de conteúdos do seu site.',                        'seguranca',      'gratis',  'escudo',    '#27ae60'),
  ('facebook-auto',     'Facebook Post Automático',       'Compartilhe seus conteúdos em suas páginas do Facebook.',            'redes-sociais',  'gratis',  'facebook',  '#1877f2'),
  ('notif-push',        'Notificações Push',              'Envie notificações push aos inscritos no seu site.',                 'engajamento',    'gratis',  'sino',      '#e74c3c'),
  ('ads-texto',         'Ads Texto',                      'Adicione publicidade entre parágrafos das notícias.',                'monetizacao',    'gratis',  'ads',       '#f39c12'),
  ('google-analytics',  'Google Analytics',               'Gere relatórios de acessos ao seu site.',                            'analytics',      'gratis',  'analytics', '#e8710a');

-- Configurações iniciais
INSERT IGNORE INTO config (chave, valor) VALUES
  ('portal',   JSON_OBJECT('nome','Portal Jacaré Tucujú','slogan','Notícias do Amapá e Região','url','')),
  ('redes',    JSON_OBJECT('facebook','','instagram','','youtube','','twitter','')),
  ('whatsapp', JSON_OBJECT('grupo','','numero','')),
  ('tema',     JSON_OBJECT('presetAtivo','tijolo','modo','claro','corPrimaria','#c9551d',
                           'fontes', JSON_OBJECT('display','Fraunces','body','Geist'))),
  ('layout',   JSON_OBJECT(
                 'topo',     JSON_OBJECT('cor','padrao','tamanhoLogo','40','alinhamentoLogo','centro','dataNoTopo',false,'storiesDesktop',true,'storiesMobile',true),
                 'widgets',  JSON_OBJECT('tempoNoTopo',true,'tempoCompleto',true,'financas',false,'loteria',false,'sidebarSocial',true,'sidebarMaisLidas',true,'sidebarCategorias',true,'sidebarEnquete',true,'sidebarClassificados',true,'sidebarNewsletter',true),
                 'menu',     JSON_OBJECT('corFundo','branca','itens', JSON_ARRAY('','','','','','','','','','',''),'exibirMobile',true),
                 'secaoPrincipal', JSON_OBJECT('layoutHero','editorial','mostrarManchete',true,'mostrarCarrossel',true,'mostrarSecundarias',true,'qtdSecundarias',4),
                 'secoesExtras',   JSON_OBJECT('breakingNews',true,'secaoMunicipios',true,'secaoVideos',true,'secaoEnqueteDestaque',true,'secaoClassificados',true,'secaoColunistas',true),
                 'publicidades',   JSON_OBJECT('permitirAds',true,'pausarTodos',false),
                 'outros',         JSON_OBJECT('breakingNewsMs',65000,'heroCarouselMs',5500,'mostrarCopyright',true,'mostrarPoweredBy',true,'densidade','confortavel')
               ));
