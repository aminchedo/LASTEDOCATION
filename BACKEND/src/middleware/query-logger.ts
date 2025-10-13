import { QueryConfig, QueryResult } from 'pg';
import { log } from '../config/logger';

interface QueryLogData {
  query: string;
  params?: any[];
  duration: number;
  rowCount?: number;
  error?: string;
}

export class QueryLogger {
  private static slowQueryThreshold = 1000; // 1 second

  static logQuery(
    query: string | QueryConfig,
    params: any[] | undefined,
    duration: number,
    result?: QueryResult,
    error?: Error
  ) {
    const queryText = typeof query === 'string' ? query : query.text;
    const queryParams = params || (typeof query === 'object' ? query.values : undefined);

    const logData: QueryLogData = {
      query: queryText,
      params: queryParams,
      duration,
      rowCount: result?.rowCount ?? undefined,
      error: error?.message,
    };

    // Log slow queries as warnings
    if (duration > this.slowQueryThreshold) {
      log.warn('Slow database query detected', logData);
    } else if (error) {
      log.error('Database query failed', logData);
    } else {
      log.debug('Database query executed', logData);
    }
  }

  static wrapQuery<T>(
    queryFn: () => Promise<T>,
    query: string | QueryConfig,
    params?: any[]
  ): Promise<T> {
    const startTime = Date.now();

    return queryFn()
      .then((result) => {
        const duration = Date.now() - startTime;
        this.logQuery(query, params, duration, result as any);
        return result;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        this.logQuery(query, params, duration, undefined, error);
        throw error;
      });
  }
}

// Wrap database query function
export const loggedQuery = async <T extends QueryResult = any>(
  queryText: string,
  params?: any[]
): Promise<T> => {
  // This will be integrated with your database connection
  const { query: dbQuery } = await import('../database/connection');
  
  return QueryLogger.wrapQuery(
    () => dbQuery(queryText, params) as Promise<T>,
    queryText,
    params
  );
};
