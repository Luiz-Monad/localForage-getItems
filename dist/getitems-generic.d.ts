import { LocalForageComplete } from '@luiz-monad/localforage/dist/types';
import { ItemsResult } from './localforage-getitems';
export declare function getItemsGeneric<T>(this: LocalForageComplete, keys: string[]): Promise<ItemsResult<T>>;
export declare function getAllItemsUsingKeys<T>(this: LocalForageComplete): Promise<ItemsResult<T>>;
export declare function getAllItemsUsingKeysParallel<T>(this: LocalForageComplete): Promise<(Awaited<T> | null)[]>;
export declare function getAllItemsUsingIterate<T>(this: LocalForageComplete): Promise<ItemsResult<T>>;
