/// <reference types="./postgres-driver.d.ts" />
import { CompiledQuery } from '../../query-compiler/compiled-query.js';
import { isFunction, freeze } from '../../util/object-utils.js';
import { extendStackTrace } from '../../util/stack-trace-utils.js';
const PRIVATE_RELEASE_METHOD = Symbol();
export class PostgresDriver {
    #config;
    #connections = new WeakMap();
    #pool;
    constructor(config) {
        this.#config = freeze({ ...config });
    }
    async init() {
        this.#pool = isFunction(this.#config.pool)
            ? await this.#config.pool()
            : this.#config.pool;
    }
    async acquireConnection() {
        const client = await this.#pool.connect();
        let connection = this.#connections.get(client);
        if (!connection) {
            connection = new PostgresConnection(client, {
                cursor: this.#config.cursor ?? null,
            });
            this.#connections.set(client, connection);
            // The driver must take care of calling `onCreateConnection` when a new
            // connection is created. The `pg` module doesn't provide an async hook
            // for the connection creation. We need to call the method explicitly.
            if (this.#config.onCreateConnection) {
                await this.#config.onCreateConnection(connection);
            }
        }
        return connection;
    }
    async beginTransaction(connection, settings) {
        if (settings.isolationLevel) {
            await connection.executeQuery(CompiledQuery.raw(`start transaction isolation level ${settings.isolationLevel}`));
        }
        else {
            await connection.executeQuery(CompiledQuery.raw('begin'));
        }
    }
    async commitTransaction(connection) {
        await connection.executeQuery(CompiledQuery.raw('commit'));
    }
    async rollbackTransaction(connection) {
        await connection.executeQuery(CompiledQuery.raw('rollback'));
    }
    async releaseConnection(connection) {
        connection[PRIVATE_RELEASE_METHOD]();
    }
    async destroy() {
        if (this.#pool) {
            const pool = this.#pool;
            this.#pool = undefined;
            await pool.end();
        }
    }
}
class PostgresConnection {
    #client;
    #options;
    constructor(client, options) {
        this.#client = client;
        this.#options = options;
    }
    async executeQuery(compiledQuery) {
        try {
            const result = await this.#client.query(compiledQuery.sql, [
                ...compiledQuery.parameters,
            ]);
            if (result.command === 'INSERT' ||
                result.command === 'UPDATE' ||
                result.command === 'DELETE' ||
                result.command === 'MERGE') {
                const numAffectedRows = BigInt(result.rowCount);
                return {
                    // TODO: remove.
                    numUpdatedOrDeletedRows: numAffectedRows,
                    numAffectedRows,
                    rows: result.rows ?? [],
                };
            }
            return {
                rows: result.rows ?? [],
            };
        }
        catch (err) {
            throw extendStackTrace(err, new Error());
        }
    }
    async *streamQuery(compiledQuery, chunkSize) {
        if (!this.#options.cursor) {
            throw new Error("'cursor' is not present in your postgres dialect config. It's required to make streaming work in postgres.");
        }
        if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
            throw new Error('chunkSize must be a positive integer');
        }
        const cursor = this.#client.query(new this.#options.cursor(compiledQuery.sql, compiledQuery.parameters.slice()));
        try {
            while (true) {
                const rows = await cursor.read(chunkSize);
                if (rows.length === 0) {
                    break;
                }
                yield {
                    rows,
                };
            }
        }
        finally {
            await cursor.close();
        }
    }
    [PRIVATE_RELEASE_METHOD]() {
        this.#client.release();
    }
}
