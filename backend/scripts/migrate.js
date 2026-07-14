const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');

const migrationsDir = path.join(__dirname, '..', 'migrations');
const dryRun = process.argv.includes('--dry-run');

const singleStatement = (sql, filename) => {
    const statements = sql
        .replace(/^\s*--.*$/gm, '')
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean);
    if (statements.length !== 1) {
        throw new Error(`${filename} deve conter exatamente uma instrução SQL. Divida migrations em arquivos menores.`);
    }
    return statements[0];
};

const isDdl = (sql) => /^(CREATE|ALTER|DROP|RENAME|TRUNCATE)\b/i.test(sql.trim());

async function main() {
    const connection = await db.getConnection();
    let locked = false;

    try {
        const [[lock]] = await connection.query("SELECT GET_LOCK('revendasmart_schema_migrations', 30) AS locked");
        if (!lock.locked) throw new Error('Não foi possível obter a trava de migrations.');
        locked = true;

        await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            filename VARCHAR(255) NOT NULL,
            checksum CHAR(64) NOT NULL,
            applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_schema_migrations_filename (filename)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
        const [applied] = await connection.query('SELECT filename, checksum FROM schema_migrations');
        const appliedByFile = new Map(applied.map((migration) => [migration.filename, migration.checksum]));
        let pending = 0;

        for (const filename of files) {
            const sql = await fs.readFile(path.join(migrationsDir, filename), 'utf8');
            const statement = singleStatement(sql, filename);
            const checksum = crypto.createHash('sha256').update(sql).digest('hex');
            const existingChecksum = appliedByFile.get(filename);
            if (existingChecksum) {
                if (existingChecksum !== checksum) throw new Error(`Migration aplicada foi alterada: ${filename}`);
                continue;
            }
            pending += 1;
            if (dryRun) {
                console.log(`[dry-run] ${filename}`);
                continue;
            }
            console.log(`Aplicando ${filename}`);
            if (isDdl(statement)) {
                // MySQL trata DDL com commit implícito. Cada migration de schema é
                // limitada a uma instrução atômica e só é marcada após sucesso.
                await connection.query(statement);
                await connection.query('INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)', [filename, checksum]);
                continue;
            }

            await connection.beginTransaction();
            try {
                await connection.query(statement);
                await connection.query('INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)', [filename, checksum]);
                await connection.commit();
            } catch (error) {
                await connection.rollback();
                throw new Error(`Falha em ${filename}: ${error.message}`);
            }
        }
        if (!pending) console.log('Nenhuma migration pendente.');
        if (dryRun && pending) console.log(`${pending} migration(s) pendente(s).`);
    } finally {
        if (locked) await connection.query("SELECT RELEASE_LOCK('revendasmart_schema_migrations')");
        connection.release();
        await db.end();
    }
}

main().catch((error) => {
    console.error(`Migration interrompida: ${error.message}`);
    process.exitCode = 1;
});
