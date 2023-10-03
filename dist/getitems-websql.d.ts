/// <reference types="websql" />
import { Forage, Options, LocalForageComplete } from '@luiz-monad/localforage/dist/types';
import { ItemsResult } from './localforage-getitems';
export interface DbInfo extends Options {
    db: Database | null;
    version: number;
}
export declare function getItemsWebsql<T>(this: Forage<DbInfo> & LocalForageComplete, keys: string[]): Promise<ItemsResult<T>>;
