import { LocalForageComplete } from '@luiz-monad/localforage/dist/types';
import { KeyValue, getItemKeyValue } from './utils';
import { ItemsResult } from './localforage-getitems';

export function getItemsGeneric<T>(this: LocalForageComplete, keys: string[]) {
    const localforageInstance = this;
    const promise = new Promise<ItemsResult<T>>(function (resolve, reject) {
        const itemPromises: Promise<KeyValue<T>>[] = [];

        const sortedKeys = keys.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

        for (let i = 0, len = sortedKeys.length; i < len; i++) {
            itemPromises.push(
                (getItemKeyValue<T>).call(localforageInstance, String(sortedKeys[i]))
            );
        }

        Promise.all(itemPromises)
            .then(function (keyValuePairs) {
                const result: ItemsResult<T> = {};
                for (let i = 0, len = keyValuePairs.length; i < len; i++) {
                    const keyValuePair = keyValuePairs[i];

                    if (keyValuePair.value) {
                        result[sortedKeys[i]] = keyValuePair.value;
                    }
                }
                resolve(result);
            })
            .catch(reject);
    });
    return promise;
}

export function getAllItemsUsingKeys<T>(this: LocalForageComplete) {
    const localforageInstance = this;
    return localforageInstance.keys().then(function (keys) {
        return localforageInstance.getItems<T>(keys);
    });
}

export function getAllItemsUsingKeysParallel<T>(this: LocalForageComplete) {
    const localforageInstance = this;
    return localforageInstance.keys().then(function (keys) {
        const itemPromises: Promise<T | null>[] = [];
        for (let i = 0, len = keys.length; i < len; i++) {
            itemPromises.push(localforageInstance.getItem<T>(keys[i]));
        }
        return Promise.all(itemPromises);
    });
}

export function getAllItemsUsingIterate<T>(this: LocalForageComplete) {
    const localforageInstance = this;
    const accumulator: ItemsResult<T> = {};
    return localforageInstance
        .iterate<T, void>(function (value, key) {
            accumulator[key] = value;
        })
        .then(function () {
            return accumulator;
        });
}
