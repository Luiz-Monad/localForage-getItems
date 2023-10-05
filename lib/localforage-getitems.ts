import { Callback, Forage, LocalForageComplete } from '@luiz-monad/localforage/dist/types';
import { executeCallback } from './utils';
import { getItemsGeneric, getAllItemsUsingIterate } from './getitems-generic';
import { DbInfo as DbInfoIndexedDB, getItemsIndexedDB } from './getitems-indexeddb';
import { DbInfo as DbInfoWebsql, getItemsWebsql } from './getitems-websql';
import localforage from '@luiz-monad/localforage';

export function localforageGetItems<T>(): Promise<ItemsResult<T>>;
export function localforageGetItems<T>(
    keys: string[] | null,
    callback?: Callback<ItemsResult<T>>
): Promise<ItemsResult<T>>;
export function localforageGetItems<T>(
    this: LocalForageComplete,
    keys?: string[] | null,
    callback?: Callback<ItemsResult<T>>
) {
    const localforageInstance = this;

    let promise: Promise<ItemsResult<T>>;
    if (!arguments.length || !keys) {
        promise = (getAllItemsUsingIterate<T>).apply(localforageInstance);
    } else {
        const currentDriver = localforageInstance.driver();
        if (currentDriver === localforageInstance.INDEXEDDB) {
            promise = (getItemsIndexedDB<T>).apply(localforageInstance as any, [keys]);
        } else if (currentDriver === localforageInstance.WEBSQL) {
            promise = (getItemsWebsql<T>).apply(localforageInstance as any, [keys]);
        } else {
            promise = (getItemsGeneric<T>).apply(localforageInstance, [keys]);
        }
    }

    executeCallback(promise, callback);
    return promise;
}

export function extendPrototype(localforage: LocalForageComplete) {
    const localforagePrototype = Object.getPrototypeOf(localforage) as LocalForageComplete;
    if (localforagePrototype) {
        (localforagePrototype.getItems as Partial<MethodsCoreWithGetItems['getItems']>) =
            localforageGetItems;
        localforagePrototype.getItems.indexedDB = function <T>(
            this: Forage<DbInfoIndexedDB> & LocalForageComplete,
            keys?: string[] | null
        ) {
            return (getItemsIndexedDB<T>).apply(this, [keys!]);
        };
        localforagePrototype.getItems.websql = function <T>(
            this: Forage<DbInfoWebsql> & LocalForageComplete,
            keys?: string[] | null
        ) {
            return (getItemsWebsql<T>).apply(this, [keys!]);
        };
        localforagePrototype.getItems.generic = function <T>(
            this: LocalForageComplete,
            keys?: string[] | null
        ) {
            return (getItemsGeneric<T>).apply(this, [keys!]);
        };
    }
    return localforage;
}

export const extendPrototypeResult = extendPrototype(localforage);

export type ItemsResult<T> = Record<string, T | null>;

export interface MethodsCoreWithGetItems {
    getItems<T>(): Promise<ItemsResult<T>>;
    getItems<T>(
        keys: string[] | null,
        callback?: Callback<ItemsResult<T>>
    ): Promise<ItemsResult<T>>;
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
