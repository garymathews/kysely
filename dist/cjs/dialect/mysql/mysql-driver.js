"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MysqlDriver = void 0;
const compiled_query_js_1 = require("../../query-compiler/compiled-query.js");
const object_utils_js_1 = require("../../util/object-utils.js");
const stack_trace_utils_js_1 = require("../../util/stack-trace-utils.js");
const PRIVATE_RELEASE_METHOD = Symbol();
class MysqlDriver {
    #config;
    #connections = new WeakMap();
    #pool;
    constructor(configOrPool) {
        this.#config = (0, object_utils_js_1.freeze)({ ...configOrPool });
    }
    async init() {
        this.#pool = (0, object_utils_js_1.isFunction)(this.#config.pool)
            ? await this.#config.pool()
            : this.#config.pool;
    }
    async acquireConnection() {
        const rawConnection = await this.#acquireConnection();
        let connection = this.#connections.get(rawConnection);
        if (!connection) {
            connection = new MysqlConnection(rawConnection);
            this.#connections.set(rawConnection, connection);
            // The driver must take care of calling `onCreateConnection` when a new
            // connection is created. The `mysql2` module doesn't provide an async hook
            // for the connection creation. We need to call the method explicitly.
            if (this.#config?.onCreateConnection) {
                await this.#config.onCreateConnection(connection);
            }
        }
        return connection;
    }
    async #acquireConnection() {
        return new Promise((resolve, reject) => {
            this.#pool.getConnection(async (err, rawConnection) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rawConnection);
                }
            });
        });
    }
    async beginTransaction(connection, settings) {
        if (settings.isolationLevel) {
            // On MySQL this sets the isolation level of the next transaction.
            await connection.executeQuery(compiled_query_js_1.CompiledQuery.raw(`set transaction isolation level ${settings.isolationLevel}`));
        }
        await connection.executeQuery(compiled_query_js_1.CompiledQuery.raw('begin'));
    }
    async commitTransaction(connection) {
        await connection.executeQuery(compiled_query_js_1.CompiledQuery.raw('commit'));
    }
    async rollbackTransaction(connection) {
        await connection.executeQuery(compiled_query_js_1.CompiledQuery.raw('rollback'));
    }
    async releaseConnection(connection) {
        connection[PRIVATE_RELEASE_METHOD]();
    }
    async destroy() {
        return new Promise((resolve, reject) => {
            this.#pool.end((err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
}
exports.MysqlDriver = MysqlDriver;
function isOkPacket(obj) {
    return (0, object_utils_js_1.isObject)(obj) && 'insertId' in obj && 'affectedRows' in obj;
}
class MysqlConnection {
    #rawConnection;
    constructor(rawConnection) {
        this.#rawConnection = rawConnection;
    }
    async executeQuery(compiledQuery) {
        try {
            const result = await this.#executeQuery(compiledQuery);
            if (isOkPacket(result)) {
                const { insertId, affectedRows, changedRows } = result;
                const numAffectedRows = affectedRows !== undefined && affectedRows !== null
                    ? BigInt(affectedRows)
                    : undefined;
                const numChangedRows = changedRows !== undefined && changedRows !== null
                    ? BigInt(changedRows)
                    : undefined;
                return {
                    insertId: insertId !== undefined &&
                        insertId !== null &&
                        insertId.toString() !== '0'
                        ? BigInt(insertId)
                        : undefined,
                    // TODO: remove.
                    numUpdatedOrDeletedRows: numAffectedRows,
                    numAffectedRows,
                    numChangedRows,
                    rows: [],
                };
            }
            else if (Array.isArray(result)) {
                return {
                    rows: result,
                };
            }
            return {
                rows: [],
            };
        }
        catch (err) {
            throw (0, stack_trace_utils_js_1.extendStackTrace)(err, new Error());
        }
    }
    #executeQuery(compiledQuery) {
        return new Promise((resolve, reject) => {
            this.#rawConnection.query(compiledQuery.sql, compiledQuery.parameters, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }
    async *streamQuery(compiledQuery, _chunkSize) {
        const stream = this.#rawConnection
            .query(compiledQuery.sql, compiledQuery.parameters)
            .stream({
            objectMode: true,
        });
        try {
            for await (const row of stream) {
                yield {
                    rows: [row],
                };
            }
        }
        catch (ex) {
            if (ex &&
                typeof ex === 'object' &&
                'code' in ex &&
                // @ts-ignore
                ex.code === 'ERR_STREAM_PREMATURE_CLOSE') {
                // Most likely because of https://github.com/mysqljs/mysql/blob/master/lib/protocol/sequences/Query.js#L220
                return;
            }
            throw ex;
        }
    }
    [PRIVATE_RELEASE_METHOD]() {
        this.#rawConnection.release();
    }
}
