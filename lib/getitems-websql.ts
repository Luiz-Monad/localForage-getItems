import { Forage, Options, LocalForageComplete } from '@luiz-monad/localforage/dist/types';
import { getSerializerPromise } from './utils';
import { ItemsResult } from './localforage-getitems';

export interface DbInfo extends Options {
    db: Database | null;
    version: number;
}

export function getItemsWebsql<T>(this: Forage<DbInfo> & LocalForageComplete, keys: string[]) {
    const localforageInstance = this;
    const promise = new Promise<ItemsResult<T>>(function (resolve, reject) {
        localforageInstance
            .ready()
            .then(function () {
                return getSerializerPromise(localforageInstance);
            })
            .then(function (serializer) {
                const dbInfo = localforageInstance._dbInfo;
                dbInfo.db!.transaction(function (t) {
                    const queryParts = new Array(keys.length);
                    for (let i = 0, len = keys.length; i < len; i++) {
                        queryParts[i] = '?';
                    }

                    t.executeSql(
                        `SELECT * FROM ${dbInfo.storeName} WHERE (key IN (${queryParts.join(
                            ','
                        )}))`,
                        keys,
                        function (t, results) {
                            const result: ItemsResult<T> = {};

                            const rows = results.rows;
                            for (let i = 0, len = rows.length; i < len; i++) {
                                const item = rows.item(i);
                                const svalue = item.value as string;
                                let value: T | null = null;

                                // Check to see if this is serialized content we need to
                                // unpack.
                                if (svalue) {
                                    value = serializer.deserialize(svalue) as T;
                                }

                                result[item.key] = value;
                            }

                            resolve(result);
                        },
                        function (t, error) {
                            reject(error);
                            return false;
                        }
                    );
                });
            })
            .catch(reject);
    });
    return promise;
}
