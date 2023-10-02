import { Forage, Options, LocalForageComplete } from '@luiz-monad/localforage/dist/types';
import IDBKeyRange from './idbKeyRange';
import { ItemsResult } from './localforage-getitems';

export interface DbInfo extends Options {
    db: IDBDatabase | null;
    version: number;
}

export function getItemsIndexedDB<T>(this: Forage<DbInfo> & LocalForageComplete, keys: string[]) {
    keys = keys.slice();
    const localforageInstance = this;
    function comparer(a: string, b: string) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    const promise = new Promise<ItemsResult<T>>(function (resolve, reject) {
        localforageInstance
            .ready()
            .then(function () {
                // Thanks https://hacks.mozilla.org/2014/06/breaking-the-borders-of-indexeddb/
                const dbInfo = localforageInstance._dbInfo;
                const store = dbInfo
                    .db!.transaction(dbInfo.storeName, 'readonly')
                    .objectStore(dbInfo.storeName);

                const set = keys.sort(comparer);

                const keyRangeValue = IDBKeyRange.bound(
                    keys[0],
                    keys[keys.length - 1],
                    false,
                    false
                );

                let breq: IDBRequest<any>;

                if ('getAll' in (store as any)) {
                    const req = store.getAll(keyRangeValue);
                    req.onsuccess = function () {
                        const result: ItemsResult<T> = {};
                        const avalue = req.result as any[] | undefined;
                        if (avalue !== undefined) {
                            for (let i = 0, len = avalue.length; i < len; i++) {
                                result[i.toString()] = avalue[i];
                            }
                        }
                        resolve(result);
                    };
                    breq = req;
                } else {
                    const req = store.openCursor(keyRangeValue);
                    const result: Record<string, T> = {};
                    let i = 0;

                    req.onsuccess = function () {
                        const cursor = req.result;

                        if (!cursor) {
                            resolve(result);
                            return;
                        }

                        const key = cursor.key as string;

                        while (key > set[i]) {
                            i++; // The cursor has passed beyond this key. Check next.

                            if (i === set.length) {
                                // There is no next. Stop searching.
                                resolve(result);
                                return;
                            }
                        }

                        if (key === set[i]) {
                            // The current cursor value should be included and we should continue
                            // a single step in case next item has the same key or possibly our
                            // next key in set.
                            let value = cursor.value;
                            if (value === undefined) {
                                value = null;
                            }

                            result[key] = value;
                            // onfound(cursor.value);
                            cursor.continue();
                        } else {
                            // cursor.key not yet at set[i]. Forward cursor to the next key to hunt for.
                            cursor.continue(set[i]);
                        }
                    };
                    breq = req;
                }

                breq.onerror = function () {
                    reject(breq.error);
                };
            })
            .catch(reject);
    });
    return promise;
}
