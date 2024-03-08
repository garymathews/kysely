import { OperationNodeSource } from '../operation-node/operation-node-source.js';
import { CompiledQuery } from '../query-compiler/compiled-query.js';
import { SelectExpression, SelectCallback } from '../parser/select-parser.js';
import { InsertExpression } from '../parser/insert-values-parser.js';
import { InsertQueryNode } from '../operation-node/insert-query-node.js';
import { QueryNode } from '../operation-node/query-node.js';
import { NarrowPartial, SimplifyResult, SimplifySingleResult } from '../util/type-utils.js';
import { UpdateObjectExpression } from '../parser/update-set-parser.js';
import { Compilable } from '../util/compilable.js';
import { QueryExecutor } from '../query-executor/query-executor.js';
import { QueryId } from '../util/query-id.js';
import { InsertResult } from './insert-result.js';
import { KyselyPlugin } from '../plugin/kysely-plugin.js';
import { ReturningCallbackRow, ReturningRow } from '../parser/returning-parser.js';
import { NoResultErrorConstructor } from './no-result-error.js';
import { ExpressionOrFactory } from '../parser/expression-parser.js';
import { ReturningInterface } from './returning-interface.js';
import { OnConflictBuilder, OnConflictDatabase, OnConflictDoNothingBuilder, OnConflictTables, OnConflictUpdateBuilder } from './on-conflict-builder.js';
import { Selectable } from '../util/column-type.js';
import { Explainable, ExplainFormat } from '../util/explainable.js';
import { Expression } from '../expression/expression.js';
import { KyselyTypeError } from '../util/type-error.js';
import { Streamable } from '../util/streamable.js';
export declare class InsertQueryBuilder<DB, TB extends keyof DB, O> implements ReturningInterface<DB, TB, O>, OperationNodeSource, Compilable<O>, Explainable, Streamable<O> {
    #private;
    constructor(props: InsertQueryBuilderProps);
    get isInsertQueryBuilder(): true;
    /**
     * Sets the values to insert for an {@link Kysely.insertInto | insert} query.
     *
     * This method takes an object whose keys are column names and values are
     * values to insert. In addition to the column's type, the values can be
     * raw {@link sql} snippets or select queries.
     *
     * You must provide all fields you haven't explicitly marked as nullable
     * or optional using {@link Generated} or {@link ColumnType}.
     *
     * The return value of an `insert` query is an instance of {@link InsertResult}. The
     * {@link InsertResult.insertId | insertId} field holds the auto incremented primary
     * key if the database returned one.
     *
     * On PostgreSQL and some other dialects, you need to call `returning` to get
     * something out of the query.
     *
     * Also see the {@link expression} method for inserting the result of a select
     * query or any other expression.
     *
     * ### Examples
     *
     * <!-- siteExample("insert", "Single row", 10) -->
     *
     * Insert a single row:
     *
     * ```ts
     * const result = await db
     *   .insertInto('person')
     *   .values({
     *     first_name: 'Jennifer',
     *     last_name: 'Aniston',
     *     age: 40
     *   })
     *   .executeTakeFirst()
     *
     * // `insertId` is only available on dialects that
     * // automatically return the id of the inserted row
     * // such as MySQL and SQLite. On PostgreSQL, for example,
     * // you need to add a `returning` clause to the query to
     * // get anything out. See the "returning data" example.
     * console.log(result.insertId)
     * ```
     *
     * The generated SQL (MySQL):
     *
     * ```sql
     * insert into `person` (`first_name`, `last_name`, `age`) values (?, ?, ?)
     * ```
     *
     * <!-- siteExample("insert", "Multiple rows", 20) -->
     *
     * On dialects that support it (for example PostgreSQL) you can insert multiple
     * rows by providing an array. Note that the return value is once again very
     * dialect-specific. Some databases may only return the id of the *last* inserted
     * row and some return nothing at all unless you call `returning`.
     *
     * ```ts
     * await db
     *   .insertInto('person')
     *   .values([{
     *     first_name: 'Jennifer',
     *     last_name: 'Aniston',
     *     age: 40,
     *   }, {
     *     first_name: 'Arnold',
     *     last_name: 'Schwarzenegger',
     *     age: 70,
     *   }])
     *   .execute()
     * ```
     *
     * The generated SQL (PostgreSQL):
     *
     * ```sql
     * insert into "person" ("first_name", "last_name", "age") values (($1, $2, $3), ($4, $5, $6))
     * ```
     *
     * <!-- siteExample("insert", "Returning data", 30) -->
     *
     * On supported dialects like PostgreSQL you need to chain `returning` to the query to get
     * the inserted row's columns (or any other expression) as the return value. `returning`
     * works just like `select`. Refer to `select` method's examples and documentation for
     * more info.
     *
     * ```ts
     * const result = await db
     *   .insertInto('person')
     *   .values({
     *     first_name: 'Jennifer',
     *     last_name: 'Aniston',
     *     age: 40,
     *   })
     *   .returning(['id', 'first_name as name'])
     *   .executeTakeFirstOrThrow()
     * ```
     *
     * The generated SQL (PostgreSQL):
     *
     * ```sql
     * insert into "person" ("first_name", "last_name", "age") values ($1, $2, $3) returning "id", "first_name" as "name"
     * ```
     *
     * <!-- siteExample("insert", "Complex values", 40) -->
     *
     * In addition to primitives, the values can also be arbitrary expressions.
     * You can build the expressions by using a callback and calling the methods
     * on the expression builder passed to it:
     *
     * ```ts
     * import { sql } from 'kysely'
     *
     * const ani = "Ani"
     * const ston = "ston"
     *
     * const result = await db
     *   .insertInto('person')
     *   .values(({ ref, selectFrom, fn }) => ({
     *     first_name: 'Jennifer',
     *     last_name: sql`concat(${ani}, ${ston})`,
     *     middle_name: ref('first_name'),
     *     age: selectFrom('person')
     *       .select(fn.avg<number>('age')
     *       .as('avg_age')),
     *   }))
     *   .executeTakeFirst()
     * ```
     *
     * The generated SQL (PostgreSQL):
     *
     * ```sql
     * insert into "person" (
     *   "first_name",
     *   "last_name",
     *   "middle_name",
     *   "age"
     * )
     * values (
     *   $1,
     *   concat($2, $3),
     *   "first_name",
     *   (select avg("age") as "avg_age" from "person")
     * )
     * ```
     *
     * You can also use the callback version of subqueries or raw expressions:
     *
     * ```ts
     * db.with('jennifer', (db) => db
     *   .selectFrom('person')
     *   .where('first_name', '=', 'Jennifer')
     *   .select(['id', 'first_name', 'gender'])
     *   .limit(1)
     * ).insertInto('pet').values((eb) => ({
     *   owner_id: eb.selectFrom('jennifer').select('id'),
     *   name: eb.selectFrom('jennifer').select('first_name'),
     *   species: 'cat',
     * }))
     * ```
     */
    values(insert: InsertExpression<DB, TB>): InsertQueryBuilder<DB, TB, O>;
    /**
     * Sets the columns to insert.
     *
     * The {@link values} method sets both the columns and the values and this method
     * is not needed. But if you are using the {@link expression} method, you can use
     * this method to set the columns to insert.
     *
     * ### Examples
     *
     * ```ts
     * db.insertInto('person')
     *   .columns(['first_name'])
     *   .expression((eb) => eb.selectFrom('pet').select('pet.name'))
     * ```
     *
     * The generated SQL (PostgreSQL):
     *
     * ```sql
     * insert into "person" ("first_name")
     * select "pet"."name" from "pet"
     * ```
     */
    columns(columns: ReadonlyArray<keyof DB[TB] & string>): InsertQueryBuilder<DB, TB, O>;
    /**
     * Insert an arbitrary expression. For example the result of a select query.
     *
     * ### Examples
     *
     * <!-- siteExample("insert", "Insert subquery", 50) -->
     *
     * You can create an `INSERT INTO SELECT FROM` query using the `expression` method:
     *
     * ```ts
     * const result = await db.insertInto('person')
     *   .columns(['first_name', 'last_name', 'age'])
     *   .expression((eb) => eb
     *     .selectFrom('pet')
     *     .select((eb) => [
     *       'pet.name',
     *       eb.val('Petson').as('last_name'),
     *       eb.lit(7).as('age'),
     *     ])
     *   )
     *   .execute()
     * ```
     *
     * The generated SQL (PostgreSQL):
     *
     * ```sql
     * insert into "person" ("first_name", "last_name", "age")
     * select "pet"."name", $1 as "last_name", 7 as "age from "pet"
     * ```
     */
    expression(expression: ExpressionOrFactory<DB, TB, any>): InsertQueryBuilder<DB, TB, O>;
    /**
     * Creates an `insert into "person" default values` query.
     *
     * ### Examples
     *
     * ```ts
     * await db.insertInto('person')
     *   .defaultValues()
     *   .execute()
     * ```
     */
    defaultValues(): InsertQueryBuilder<DB, TB, O>;
    /**
     * Changes an `insert into` query to an `insert ignore into` query.
     *
     * If you use the ignore modifier, ignorable errors that occur while executing the
     * insert statement are ignored. For example, without ignore, a row that duplicates
     * an existing unique index or primary key value in the table causes a duplicate-key
     * error and the statement is aborted. With ignore, the row is discarded and no error
     * occurs.
     *
     * This is only supported on some dialects like MySQL. On most dialects you should
     * use the {@link onConflict} method.
     *
     * ### Examples
     *
     * ```ts
     * await db.insertInto('person')
     *   .ignore()
     *   .values(values)
     *   .execute()
     * ```
     */
    ignore(): InsertQueryBuilder<DB, TB, O>;
    /**
     * Changes an `insert into` query to an `insert top into` query.
     *
     * `top` clause is only supported by some dialects like MS SQL Server.
     *
     * ### Examples
     *
     * Insert the first 5 rows:
     *
     * ```ts
     * await db.insertInto('person')
     *   .top(5)
     *   .columns(['first_name', 'gender'])
     *   .expression(
     *     (eb) => eb.selectFrom('pet').select(['name', sql.lit('other').as('gender')])
     *   )
     *   .execute()
     * ```
     *
     * The generated SQL (MS SQL Server):
     *
     * ```sql
     * insert top(5) into "person" ("first_name", "gender") select "name", 'other' as "gender" from "pet"
     * ```
     *
     * Insert the first 50 percent of rows:
     *
     * ```ts
     * await db.insertInto('person')
     *   .top(50, 'percent')
     *   .columns(['first_name', 'gender'])
     *   .expression(
     *     (eb) => eb.selectFrom('pet').select(['name', sql.lit('other').as('gender')])
     *   )
     *   .execute()
     * ```
     *
     * The generated SQL (MS SQL Server):
     *
     * ```sql
     * insert top(50) percent into "person" ("first_name", "gender") select "name", 'other' as "gender" from "pet"
     * ```
     */
    top(expression: number | bigint, modifiers?: 'percent'): InsertQueryBuilder<DB, TB, O>;
    /**
     * Adds an `on conflict` clause to the query.
     *
     * `on conflict` is only supported by some dialects like PostgreSQL and SQLite. On MySQL
     * you can use {@link ignore} and {@link onDuplicateKeyUpdate} to achieve similar results.
     *
     * ### Examples
     *
     * ```ts
     * await db
     *   .insertInto('pet')
     *   .values({
     *     name: 'Catto',
     *     species: 'cat',
     *   })
     *   .onConflict((oc) => oc
     *     .column('name')
     *     .doUpdateSet({ species: 'hamster' })
     *   )
     *   .execute()
     * ```
     *
     * The generated SQL (PostgreSQL):
     *
     * ```sql
     * insert into "pet" ("name", "species")
     * values ($1, $2)
     * on conflict ("name")
     * do update set "species" = $3
     * ```
     *
     * You can provide the name of the constraint instead of a column name:
     *
     * ```ts
     * await db
     *   .insertInto('pet')
     *   .values({
     *     name: 'Catto',
     *     species: 'cat',
     *   })
     *   .onConflict((oc) => oc
     *     .constraint('pet_name_key')
     *     .doUpdateSet({ species: 'hamster' })
     *   )
     *   .execute()
     * ```
     *
     * The generated SQL (PostgreSQL):
     *
     * ```sql
     * insert into "pet" ("name", "species")
     * values ($1, $2)
     * on conflict on constraint "pet_name_key"
     * do update set "species" = $3
     * ```
     *
     * You can also specify an expression as the conflict target in case
     * the unique index is an expression index:
     *
     * ```ts
     * import { sql } from 'kysely'
     *
     * await db
     *   .insertInto('pet')
     *   .values({
     *     name: 'Catto',
     *     species: 'cat',
     *   })
     *   .onConflict((oc) => oc
     *     .expression(sql`lower(name)`)
     *     .doUpdateSet({ species: 'hamster' })
     *   )
     *   .execute()
     * ```
     *
     * The generated SQL (PostgreSQL):
     *
     * ```sql
     * insert into "pet" ("name", "species")
     * values ($1, $2)
     * on conflict (lower(name))
     * do update set "species" = $3
     * ```
     *
     * You can add a filter for the update statement like this:
     *
     * ```ts
     * await db
     *   .insertInto('pet')
     *   .values({
     *     name: 'Catto',
     *     species: 'cat',
     *   })
     *   .onConflict((oc) => oc
     *     .column('name')
     *     .doUpdateSet({ species: 'hamster' })
     *     .where('excluded.name', '!=', 'Catto'')
     *   )
     *   .execute()
     * ```
     *
     * The generated SQL (PostgreSQL):
     *
     * ```sql
     * insert into "pet" ("name", "species")
     * values ($1, $2)
     * on conflict ("name")
     * do update set "species" = $3
     * where "excluded"."name" != $4
     * ```
     *
     * You can create an `on conflict do nothing` clauses like this:
     *
     * ```ts
     * await db
     *   .insertInto('pet')
     *   .values({
     *     name: 'Catto',
     *     species: 'cat',
     *   })
     *   .onConflict((oc) => oc
     *     .column('name')
     *     .doNothing()
     *   )
     *   .execute()
     * ```
     *
     * The generated SQL (PostgreSQL):
     *
     * ```sql
     * insert into "pet" ("name", "species")
     * values ($1, $2)
     * on conflict ("name") do nothing
     * ```
     *
     * You can refer to the columns of the virtual `excluded` table
     * in a type-safe way using a callback and the `ref` method of
     * `ExpressionBuilder`:
     *
     * ```ts
     * db.insertInto('person')
     *   .values(person)
     *   .onConflict(oc => oc
     *     .column('id')
     *     .doUpdateSet({
     *       first_name: (eb) => eb.ref('excluded.first_name'),
     *       last_name: (eb) => eb.ref('excluded.last_name')
     *     })
     *   )
     * ```
     */
    onConflict(callback: (builder: OnConflictBuilder<DB, TB>) => OnConflictUpdateBuilder<OnConflictDatabase<DB, TB>, OnConflictTables<TB>> | OnConflictDoNothingBuilder<DB, TB>): InsertQueryBuilder<DB, TB, O>;
    /**
     * Adds `on duplicate key update` to the query.
     *
     * If you specify `on duplicate key update`, and a row is inserted that would cause
     * a duplicate value in a unique index or primary key, an update of the old row occurs.
     *
     * This is only implemented by some dialects like MySQL. On most dialects you should
     * use {@link onConflict} instead.
     *
     * ### Examples
     *
     * ```ts
     * await db
     *   .insertInto('person')
     *   .values(values)
     *   .onDuplicateKeyUpdate({ species: 'hamster' })
     * ```
     */
    onDuplicateKeyUpdate(update: UpdateObjectExpression<DB, TB, TB>): InsertQueryBuilder<DB, TB, O>;
    /**
     * Allows you to return data from modified rows.
     *
     * On supported databases like PostgreSQL, this method can be chained to
     * `insert`, `update` and `delete` queries to return data.
     *
     * Note that on SQLite you need to give aliases for the expressions to avoid
     * [this bug](https://sqlite.org/forum/forumpost/033daf0b32) in SQLite.
     * For example `.returning('id as id')`.
     *
     * Also see the {@link returningAll} method.
     *
     * ### Examples
     *
     * Return one column:
     *
     * ```ts
     * const { id } = await db
     *   .insertInto('person')
     *   .values({
     *     first_name: 'Jennifer',
     *     last_name: 'Aniston'
     *   })
     *   .returning('id')
     *   .executeTakeFirst()
     * ```
     *
     * Return multiple columns:
     *
     * ```ts
     * const { id, first_name } = await db
     *   .insertInto('person')
     *   .values({
     *     first_name: 'Jennifer',
     *     last_name: 'Aniston'
     *   })
     *   .returning(['id', 'last_name'])
     *   .executeTakeFirst()
     * ```
     *
     * Return arbitrary expressions:
     *
     * ```ts
     * import { sql } from 'kysely'
     *
     * const { id, full_name, first_pet_id } = await db
     *   .insertInto('person')
     *   .values({
     *     first_name: 'Jennifer',
     *     last_name: 'Aniston'
     *   })
     *   .returning((eb) => [
     *     'id as id',
     *     sql<string>`concat(first_name, ' ', last_name)`.as('full_name'),
     *     eb.selectFrom('pets').select('pet.id').limit(1).as('first_pet_id')
     *   ])
     *   .executeTakeFirst()
     * ```
     */
    returning<SE extends SelectExpression<DB, TB>>(selections: ReadonlyArray<SE>): InsertQueryBuilder<DB, TB, ReturningRow<DB, TB, O, SE>>;
    returning<CB extends SelectCallback<DB, TB>>(callback: CB): InsertQueryBuilder<DB, TB, ReturningCallbackRow<DB, TB, O, CB>>;
    returning<SE extends SelectExpression<DB, TB>>(selection: SE): InsertQueryBuilder<DB, TB, ReturningRow<DB, TB, O, SE>>;
    /**
     * Adds a `returning *` to an insert/update/delete query on databases
     * that support `returning` such as PostgreSQL.
     */
    returningAll(): InsertQueryBuilder<DB, TB, Selectable<DB[TB]>>;
    /**
     * Clears all `returning` clauses from the query.
     *
     * ### Examples
     *
     * ```ts
     * db.insertInto('person')
     *   .values({ first_name: 'James', last_name: 'Smith', age: 42 })
     *   .returning(['first_name'])
     *   .clearReturning()
     * ```
     *
     * The generated SQL(PostgreSQL):
     *
     * ```sql
     * insert into "person" ("James", "Smith", 42)
     * ```
     */
    clearReturning(): InsertQueryBuilder<DB, TB, InsertResult>;
    /**
     * Simply calls the provided function passing `this` as the only argument. `$call` returns
     * what the provided function returns.
     *
     * If you want to conditionally call a method on `this`, see
     * the {@link $if} method.
     *
     * ### Examples
     *
     * The next example uses a helper function `log` to log a query:
     *
     * ```ts
     * function log<T extends Compilable>(qb: T): T {
     *   console.log(qb.compile())
     *   return qb
     * }
     *
     * db.updateTable('person')
     *   .set(values)
     *   .$call(log)
     *   .execute()
     * ```
     */
    $call<T>(func: (qb: this) => T): T;
    /**
     * Call `func(this)` if `condition` is true.
     *
     * This method is especially handy with optional selects. Any `returning` or `returningAll`
     * method calls add columns as optional fields to the output type when called inside
     * the `func` callback. This is because we can't know if those selections were actually
     * made before running the code.
     *
     * You can also call any other methods inside the callback.
     *
     * ### Examples
     *
     * ```ts
     * async function insertPerson(values: InsertablePerson, returnLastName: boolean) {
     *   return await db
     *     .insertInto('person')
     *     .values(values)
     *     .returning(['id', 'first_name'])
     *     .$if(returnLastName, (qb) => qb.returning('last_name'))
     *     .executeTakeFirstOrThrow()
     * }
     * ```
     *
     * Any selections added inside the `if` callback will be added as optional fields to the
     * output type since we can't know if the selections were actually made before running
     * the code. In the example above the return type of the `insertPerson` function is:
     *
     * ```ts
     * {
     *   id: number
     *   first_name: string
     *   last_name?: string
     * }
     * ```
     */
    $if<O2>(condition: boolean, func: (qb: this) => InsertQueryBuilder<any, any, O2>): O2 extends InsertResult ? InsertQueryBuilder<DB, TB, InsertResult> : O2 extends O & infer E ? InsertQueryBuilder<DB, TB, O & Partial<E>> : InsertQueryBuilder<DB, TB, Partial<O2>>;
    /**
     * Change the output type of the query.
     *
     * This method call doesn't change the SQL in any way. This methods simply
     * returns a copy of this `InsertQueryBuilder` with a new output type.
     */
    $castTo<C>(): InsertQueryBuilder<DB, TB, C>;
    /**
     * Narrows (parts of) the output type of the query.
     *
     * Kysely tries to be as type-safe as possible, but in some cases we have to make
     * compromises for better maintainability and compilation performance. At present,
     * Kysely doesn't narrow the output type of the query based on {@link values} input
     * when using {@link returning} or {@link returningAll}.
     *
     * This utility method is very useful for these situations, as it removes unncessary
     * runtime assertion/guard code. Its input type is limited to the output type
     * of the query, so you can't add a column that doesn't exist, or change a column's
     * type to something that doesn't exist in its union type.
     *
     * ### Examples
     *
     * Turn this code:
     *
     * ```ts
     * const person = await db.insertInto('person')
     *   .values({ ...inputPerson, nullable_column: 'hell yeah!' })
     *   .returningAll()
     *   .executeTakeFirstOrThrow()
     *
     * if (nullable_column) {
     *   functionThatExpectsPersonWithNonNullValue(person)
     * }
     * ```
     *
     * Into this:
     *
     * ```ts
     * const person = await db.insertInto('person')
     *   .values({ ...inputPerson, nullable_column: 'hell yeah!' })
     *   .returningAll()
     *   .$narrowType<{ nullable_column: string }>()
     *   .executeTakeFirstOrThrow()
     *
     * functionThatExpectsPersonWithNonNullValue(person)
     * ```
     */
    $narrowType<T>(): InsertQueryBuilder<DB, TB, NarrowPartial<O, T>>;
    /**
     * Asserts that query's output row type equals the given type `T`.
     *
     * This method can be used to simplify excessively complex types to make typescript happy
     * and much faster.
     *
     * Kysely uses complex type magic to achieve its type safety. This complexity is sometimes too much
     * for typescript and you get errors like this:
     *
     * ```
     * error TS2589: Type instantiation is excessively deep and possibly infinite.
     * ```
     *
     * In these case you can often use this method to help typescript a little bit. When you use this
     * method to assert the output type of a query, Kysely can drop the complex output type that
     * consists of multiple nested helper types and replace it with the simple asserted type.
     *
     * Using this method doesn't reduce type safety at all. You have to pass in a type that is
     * structurally equal to the current type.
     *
     * ### Examples
     *
     * ```ts
     * const result = await db
     *   .with('new_person', (qb) => qb
     *     .insertInto('person')
     *     .values(person)
     *     .returning('id')
     *     .$assertType<{ id: string }>()
     *   )
     *   .with('new_pet', (qb) => qb
     *     .insertInto('pet')
     *     .values((eb) => ({ owner_id: eb.selectFrom('new_person').select('id'), ...pet }))
     *     .returning(['name as pet_name', 'species'])
     *     .$assertType<{ pet_name: string, species: Species }>()
     *   )
     *   .selectFrom(['new_person', 'new_pet'])
     *   .selectAll()
     *   .executeTakeFirstOrThrow()
     * ```
     */
    $assertType<T extends O>(): O extends T ? InsertQueryBuilder<DB, TB, T> : KyselyTypeError<`$assertType() call failed: The type passed in is not equal to the output type of the query.`>;
    /**
     * Returns a copy of this InsertQueryBuilder instance with the given plugin installed.
     */
    withPlugin(plugin: KyselyPlugin): InsertQueryBuilder<DB, TB, O>;
    toOperationNode(): InsertQueryNode;
    compile(): CompiledQuery<O>;
    /**
     * Executes the query and returns an array of rows.
     *
     * Also see the {@link executeTakeFirst} and {@link executeTakeFirstOrThrow} methods.
     */
    execute(): Promise<SimplifyResult<O>[]>;
    /**
     * Executes the query and returns the first result or undefined if
     * the query returned no result.
     */
    executeTakeFirst(): Promise<SimplifySingleResult<O>>;
    /**
     * Executes the query and returns the first result or throws if
     * the query returned no result.
     *
     * By default an instance of {@link NoResultError} is thrown, but you can
     * provide a custom error class, or callback as the only argument to throw a different
     * error.
     */
    executeTakeFirstOrThrow(errorConstructor?: NoResultErrorConstructor | ((node: QueryNode) => Error)): Promise<SimplifyResult<O>>;
    /**
     * Executes the query and streams the rows.
     *
     * The optional argument `chunkSize` defines how many rows to fetch from the database
     * at a time. It only affects some dialects like PostgreSQL that support it.
     *
     * ### Examples
     *
     * ```ts
     * const stream = db.
     *   .selectFrom('person')
     *   .select(['first_name', 'last_name'])
     *   .where('gender', '=', 'other')
     *   .stream()
     *
     * for await (const person of stream) {
     *   console.log(person.first_name)
     *
     *   if (person.last_name === 'Something') {
     *     // Breaking or returning before the stream has ended will release
     *     // the database connection and invalidate the stream.
     *     break
     *   }
     * }
     * ```
     */
    stream(chunkSize?: number): AsyncIterableIterator<O>;
    /**
     * Executes query with `explain` statement before the main query.
     *
     * ```ts
     * const explained = await db
     *  .selectFrom('person')
     *  .where('gender', '=', 'female')
     *  .selectAll()
     *  .explain('json')
     * ```
     *
     * The generated SQL (MySQL):
     *
     * ```sql
     * explain format=json select * from `person` where `gender` = ?
     * ```
     *
     * You can also execute `explain analyze` statements.
     *
     * ```ts
     * import { sql } from 'kysely'
     *
     * const explained = await db
     *  .selectFrom('person')
     *  .where('gender', '=', 'female')
     *  .selectAll()
     *  .explain('json', sql`analyze`)
     * ```
     *
     * The generated SQL (PostgreSQL):
     *
     * ```sql
     * explain (analyze, format json) select * from "person" where "gender" = $1
     * ```
     */
    explain<ER extends Record<string, any> = Record<string, any>>(format?: ExplainFormat, options?: Expression<any>): Promise<ER[]>;
}
export interface InsertQueryBuilderProps {
    readonly queryId: QueryId;
    readonly queryNode: InsertQueryNode;
    readonly executor: QueryExecutor;
}
