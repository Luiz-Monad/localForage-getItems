import { Callback, LocalForageComplete } from '@luiz-monad/localforage/dist/types';
export declare function localforageGetItems<T>(): Promise<ItemsResult<T>>;
export declare function localforageGetItems<T>(keys: string[] | null, callback?: Callback<ItemsResult<T>>): Promise<ItemsResult<T>>;
export declare function extendPrototype(localforage: LocalForageComplete): LocalForageComplete;
export declare const extendPrototypeResult: LocalForageComplete;
export type ItemsResult<T> = Record<string, T | null>;
export interface MethodsCoreWithGetItems {
    getItems<T>(): Promise<ItemsResult<T>>;
    getItems<T>(keys: string[] | null, callback?: Callback<ItemsResult<T>>): Promise<ItemsResult<T>>;
}
export { getItemsGeneric } from './getitems-generic';
export { getItemsIndexedDB } from './getitems-indexeddb';
export { getItemsWebsql } from './getitems-websql';
declare module '@luiz-monad/localforage/dist/types' {
    interface LocalForageComplete {
        getItems: MethodsCoreWithGetItems['getItems'] & {
            indexedDB: MethodsCoreWithGetItems['getItems'];
            websql: MethodsCoreWithGetItems['getItems'];
            generic: MethodsCoreWithGetItems['getItems'];
        };
    }
}
