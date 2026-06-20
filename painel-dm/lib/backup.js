const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = path.resolve(__dirname, '../backups');
const DATA_DIR = path.resolve(__dirname, '../data');
const UPLOADS_DIR = path.resolve(__dirname, '../public/img/uploads');

// Criar diretório de backups se não existir
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Criar backup completo usando PowerShell Compress-Archive (Windows)
 * @returns {Promise<string>} Caminho do arquivo de backup
 */
async function criarBackup() {
  return new Promise((resolve, reject) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.zip`);

      // Criar lista de arquivos a fazer backup
      const filesToBackup = [];

      // Banco de dados
      const dbFile = path.join(DATA_DIR, 'painel.db');
      if (fs.existsSync(dbFile)) {
        filesToBackup.push(dbFile);
      }

      // JSON files
      ['noticias.json', 'anuncios.json', 'categorias.json', 'videos.json'].forEach(file => {
        const filePath = path.join(DATA_DIR, file);
        if (fs.existsSync(filePath)) {
          filesToBackup.push(filePath);
        }
      });

      // Adicionar código-fonte importante
      const codeDirs = [
        path.join(__dirname, '../api'),
        path.join(__dirname, '../middleware'),
        path.join(__dirname, '../lib'),
        path.join(__dirname, '../public')
      ];

      codeDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          filesToBackup.push(dir);
        }
      });

      if (filesToBackup.length === 0) {
        return reject(new Error('Nenhum arquivo encontrado para backup'));
      }

      // Windows: usar PowerShell Compress-Archive
      if (process.platform === 'win32') {
        const pathsArray = filesToBackup.map(p => `'${p}'`).join(',');
        const cmd = `Compress-Archive -Path @(${pathsArray}) -DestinationPath '${backupFile}' -Force`;
        try {
          execSync(`powershell -NoProfile -Command "${cmd.replace(/"/g, '\\"')}"`, { shell: true, stdio: 'pipe' });
        } catch (e) {
          // PowerShell pode mostrar warnings mas ainda funcionar
          if (!fs.existsSync(backupFile)) throw e;
        }
      } else {
        // Linux/Mac: usar zip
        const filesStr = filesToBackup.map(f => f.replace(/"/g, '')).join(' ');
        execSync(`cd "${path.dirname(filesToBackup[0])}" && zip -r "${backupFile}" ${filesStr}`, { stdio: 'pipe' });
      }

      // Verificar se o arquivo foi criado
      if (fs.existsSync(backupFile)) {
        const size = (fs.statSync(backupFile).size / 1024 / 1024).toFixed(2);
        console.log(`✅ Backup criado: ${backupFile} (${size}MB)`);
        resolve(backupFile);
      } else {
        reject(new Error('Falha ao criar arquivo de backup'));
      }
    } catch (err) {
      reject(new Error(`Erro ao criar backup: ${err.message}`));
    }
  });
}

/**
 * Listar backups disponíveis
 * @returns {Array} Lista de backups
 */
function listarBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.zip'))
    .map(f => {
      const filePath = path.join(BACKUP_DIR, f);
      const stats = fs.statSync(filePath);
      return {
        nome: f,
        tamanho: `${(stats.size / 1024 / 1024).toFixed(2)}MB`,
        data: stats.birthtime,
        caminho: filePath
      };
    })
    .sort((a, b) => b.data - a.data);
}

/**
 * Restaurar backup
 * @param {string} backupFile Arquivo de backup
 * @returns {Promise<void>}
 */
async function restaurarBackup(backupFile) {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(backupFile)) {
        return reject(new Error(`Arquivo de backup não encontrado: ${backupFile}`));
      }

      console.log(`📦 Restaurando backup: ${backupFile}`);

      // Windows: usar PowerShell
      if (process.platform === 'win32') {
        const psCmd = `Expand-Archive -Path "${backupFile}" -DestinationPath "${DATA_DIR}" -Force`;
        execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: 'pipe' });
      } else {
        // Linux/Mac: usar unzip
        execSync(`cd "${DATA_DIR}" && unzip -o "${backupFile}"`, { stdio: 'pipe' });
      }

      console.log(`✅ Backup restaurado com sucesso`);
      resolve();
    } catch (err) {
      reject(new Error(`Erro ao restaurar backup: ${err.message}`));
    }
  });
}

/**
 * Deletar backup
 * @param {string} backupFile Arquivo de backup
 */
function deletarBackup(backupFile) {
  if (fs.existsSync(backupFile)) {
    fs.unlinkSync(backupFile);
    console.log(`🗑️ Backup deletado: ${backupFile}`);
  }
}

/**
 * Limpeza automática: manter apenas últimos N backups
 * @param {number} manter Quantidade de backups a manter (padrão: 10)
 */
function limparBackupsAntigos(manter = 10) {
  const backups = listarBackups();

  if (backups.length > manter) {
    const aRemover = backups.slice(manter);
    aRemover.forEach(backup => {
      deletarBackup(backup.caminho);
    });
    console.log(`🧹 Removidos ${aRemover.length} backups antigos`);
  }
}

/**
 * Agendar backup automático
 * @param {number} intervaloHoras Intervalo em horas (padrão: 24)
 */
function agendarBackupAutomatico(intervaloHoras = 24) {
  const intervaloMs = intervaloHoras * 60 * 60 * 1000;

  console.log(`📅 Backup automático agendado a cada ${intervaloHoras} hora(s)`);

  // Backup inicial
  criarBackup()
    .then(() => limparBackupsAntigos())
    .catch(err => console.error('❌ Erro no backup:', err.message));

  // Repetir em intervalo
  setInterval(() => {
    criarBackup()
      .then(() => limparBackupsAntigos())
      .catch(err => console.error('❌ Erro no backup:', err.message));
  }, intervaloMs);
}

module.exports = {
  criarBackup,
  listarBackups,
  restaurarBackup,
  deletarBackup,
  limparBackupsAntigos,
  agendarBackupAutomatico,
  BACKUP_DIR
};
