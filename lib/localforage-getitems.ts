import { Callback, Forage, LocalForageComplete } from '@luiz-monad/localforage/dist/types';
import { executeCallback } from './utils';
import { getItemsGeneric, getAllItemsUsingIterate } from './getitems-generic';
import { DbInfo as DbInfoIndexedDB, getItemsIndexedDB } from './getitems-indexeddb';
import { DbInfo as DbInfoWebsql, getItemsWebsql } from './getitems-websql';
export { getItemsGeneric } from './getitems-generic';
import localforage from '@luiz-monad/localforage';

export function localforageGetItems<T>(
    this: LocalForageComplete,
    keys: string[],
    callback?: Callback<ItemsResult<T>>
) {
    const localforageInstance = this;

    let promise: Promise<ItemsResult<T>>;
    if (!arguments.length || keys === null) {
        promise = (getAllItemsUsingIterate<T>).apply(localforageInstance);
    } else {
        const currentDriver = localforageInstance.driver();
        if (currentDriver === localforageInstance.INDEXEDDB) {
            promise = (getItemsIndexedDB<T>).apply(localforageInstance as any, [keys]);
        } else if (currentDriver === localforageInstance.WEBSQL) {
            promise = (getItemsWebsql<T>).apply(localforageInstance as any, [keys]);
        } else {
            promise = (getItemsGeneric<T>).apply(localforageInstance as any, [keys]);
        }
    }

    executeCallback(promise, callback);
    return promise;
}

export function extendPrototype(localforage: LocalForageComplete) {
    const localforagePrototype = Object.getPrototypeOf(localforage);
    if (localforagePrototype) {
        localforagePrototype.getItems = localforageGetItems;
        localforagePrototype.getItems.indexedDB = function <T> (
            this: Forage<DbInfoIndexedDB> & LocalForageComplete,
            keys: string[]
        ) {
            return (getItemsIndexedDB<T>).apply(this, [keys]);
        };
        localforagePrototype.getItems.websql = function <T> (
            this: Forage<DbInfoWebsql> & LocalForageComplete,
            keys: string[]
        ) {
            return (getItemsWebsql<T>).apply(this, [keys]);
        };
        localforagePrototype.getItems.generic = function <T> (
            this: LocalForageComplete,
            keys: string[]
        ) {
            return (getItemsGeneric<T>).apply(this, [keys]);
        };
    }
}

export const extendPrototypeResult = extendPrototype(localforage);

export type ItemsResult<T> = Record<string, T | null>;

export interface MethodsCoreWithGetItems {
    getItems<T>(
        keys: string[] | null,
        callback?: Callback<ItemsResult<T>>
    ): Promise<ItemsResult<T>>;
    getItems<T>(callback?: Callback<ItemsResult<T>>): Promise<ItemsResult<T>>;
    getItems(): {
        generic: MethodsCoreWithGetItems['getItems']
    }
}

declare module '@luiz-monad/localforage/dist/types' {
    interface LocalForageComplete {
        getItems: MethodsCoreWithGetItems['getItems'];
    }
}
