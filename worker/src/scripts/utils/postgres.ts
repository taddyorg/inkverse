import pgPackage from 'pg';

interface PsqlAdapterConfig {
  table: string;
  pk: string;
  check_pk?: string;
}

export class PsqlAdapter {
  private pool: pgPackage.Pool;
  private table: string;
  private pk: string;
  private check_pk?: string;

  constructor(connection: pgPackage.Pool, { table, pk, check_pk }: PsqlAdapterConfig) {
    if (!connection || !table || !pk) {
      throw new TypeError('PSQL requires connection, table, pk.');
    }

    this.pool = connection;
    this.table = table;
    this.pk = pk;
    this.check_pk = check_pk;
  }

  init(cb: () => void): void {
    this.pool.once('connect', cb);
  }

  private request(queryString: string, cb: (err: Error | null, result?: any) => void): void {
    this.pool.connect((err: Error | null, client: pgPackage.PoolClient, done: () => void) => {
      if (err) return cb(err);

      client.query(queryString, (err: Error | null, res: any) => {
        // release the client back into the pool immediately
        done();

        return cb(err, res);
      });
    });
  }

  fullCount(cb: (err: Error | null, count?: number) => void): void {
    const table = this.table;
    const column = this.check_pk || this.pk;

    const sqlQuery = `
      SELECT
        count(distinct(${column})) as count 
      FROM ${table}
      ;
    `;

    this.request(sqlQuery, (err: Error | null, res?: any) => {
      if (err) return cb(err);

      const count = +res.rows[0].count;
      const logStr = `[PSQL_ADAPTER] Full count for table "${table}" and column "${column}": ${count}`;
      console.log(logStr);

      cb(err, count);
    });
  }

  maxId(cb: (err: Error | null, maxId?: number) => void): void {
    const sqlQuery = `
      SELECT
        max("${this.pk}") as max_id 
      FROM ${this.table}
      ;
    `;

    this.request(sqlQuery, (err: Error | null, res?: any) => {
      if (err) return cb(err);

      const maxId = +res.rows[0].max_id;
      console.log(`[PSQL_ADAPTER] Max id: ${maxId}`);

      return cb(err, maxId);
    });
  }

  rangeCount(min: number, max: number, cb: (err: Error | null, count?: number) => void): void {
    const sqlQuery = `
      SELECT
        count(*) as count 
      FROM ${this.table}
        WHERE "${this.pk}" between ${min} and ${max}
      ;
    `;

    this.request(sqlQuery, (err: Error | null, res?: any) => {
      if (err) return cb(err);

      const count = +res.rows[0].count;
      console.log(`[PSQL_ADAPTER] Count for range ${min}-${max}: ${count}`);

      return cb(err, count);
    });
  }
}

export async function runStreamer(pgAdapter: PsqlAdapter, stream: (min: number, max: number, cb: (error?: Error) => void) => void, page_size: number, done: () => void): Promise<void> {
  console.log('[SYNC] Starting build.');

  let source_max_id: number;
  const destination_max_id = 0;

  try {
      const source_max = await new Promise<number>((resolve, reject) => {
          pgAdapter.maxId((err: Error | null, maxId?: number) => {
              if (err) {
                  reject(err);
              } else if (!maxId){
                  reject(new Error("maxId is undefined"));
              } else {
                  resolve(maxId);
              }
          });
      });

      source_max_id = +source_max;

      const jobs_n = Math.ceil((source_max_id - destination_max_id) / page_size);
      
      // early return if there are no jobs
      if (jobs_n <= 0) {
          console.log('[SYNC] No import jobs to perform.');
          return done();
      }

      // Process jobs sequentially
      let lower_bound = destination_max_id || 1;
      for (let i = 1; i <= jobs_n; i++) {
          let upper_bound = lower_bound + page_size - 1;

          if (upper_bound > source_max_id) {
              upper_bound = source_max_id;
          }

          await new Promise<void>((resolve, reject) => {
              stream(lower_bound, upper_bound, (err?: Error | null) => {
                  if (err) reject(err);
                  else resolve();
              });
          });

          lower_bound += page_size;
      }

      console.log('[SYNC] Import jobs completed.');
      return done();

  } catch (err) {
      throw err;
  }
}