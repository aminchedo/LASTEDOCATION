# SQLite Configuration Guide

The Persian TTS/AI Platform now supports both PostgreSQL and SQLite as database backends. This guide explains how to configure and use SQLite.

## Environment Variables

To use SQLite instead of PostgreSQL, set the following environment variable:

```bash
DB_ENGINE=sqlite
```

Optionally, you can specify the SQLite database file location:

```bash
SQLITE_DB_PATH=/path/to/your/database.db
```

If not specified, the default path is `./data/persian_tts.db`.

## Configuration Examples

### Using SQLite (Development)

```bash
# .env
DB_ENGINE=sqlite
SQLITE_DB_PATH=./data/dev.db
```

### Using PostgreSQL (Production)

```bash
# .env
DB_ENGINE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=persian_tts
DB_USER=postgres
DB_PASSWORD=yourpassword
```

### Docker Compose with SQLite

```yaml
version: '3.8'
services:
  backend:
    build: .
    environment:
      - DB_ENGINE=sqlite
      - SQLITE_DB_PATH=/app/data/persian_tts.db
    volumes:
      - ./data:/app/data
```

## Migration Notes

1. **Data Types**: SQLite uses different data types than PostgreSQL:
   - `UUID` → `TEXT`
   - `JSONB` → `TEXT` (JSON stored as string)
   - `BOOLEAN` → `INTEGER` (0/1)
   - `TIMESTAMP` → `DATETIME`

2. **Features**: Some PostgreSQL features are not available in SQLite:
   - No native UUID generation (use application-level UUIDs)
   - No stored procedures (use application logic)
   - Limited concurrent write support

3. **Performance**: SQLite is excellent for:
   - Development environments
   - Single-user applications
   - Read-heavy workloads
   - Embedded deployments

## Switching Between Databases

You can switch between PostgreSQL and SQLite by changing the `DB_ENGINE` environment variable and restarting the application. The schema will be automatically applied on startup.

## Backup and Restore

### SQLite Backup

```bash
# Backup
cp ./data/persian_tts.db ./backups/persian_tts_$(date +%Y%m%d).db

# Restore
cp ./backups/persian_tts_20240120.db ./data/persian_tts.db
```

### PostgreSQL to SQLite Migration

Use the provided migration script (coming soon) or export/import data through the API.

## Testing

Run tests with SQLite:

```bash
DB_ENGINE=sqlite npm test
```

## Limitations

- SQLite doesn't support multiple concurrent writers
- No real-time replication
- Limited to single-machine deployments
- Maximum database size: 281 TB (theoretical)

## Recommendations

- **Use SQLite for**: Development, testing, single-user deployments, edge devices
- **Use PostgreSQL for**: Production, multi-user deployments, high concurrency, cloud deployments