import { Forage, Options, LocalForageComplete } from '@luiz-monad/localforage/dist/types';
import { ItemsResult } from './localforage-getitems';
export interface DbInfo extends Options {
    db: IDBDatabase | null;
    version: number;
}
export declare function getItemsIndexedDB<T>(this: Forage<DbInfo> & LocalForageComplete, keys: string[]): Promise<ItemsResult<T>>;
