import { LocalForageComplete } from '@luiz-monad/localforage/dist/types';
import { KeyValue, getItemKeyValue } from './utils';
import { ItemsResult } from './localforage-getitems';

export function getItemsGeneric<T>(this: LocalForageComplete, keys: string[]) {
    var localforageInstance = this;
    var promise = new Promise<ItemsResult<T>>(function (resolve, reject) {
        var itemPromises: Promise<KeyValue<T>>[] = [];

        for (var i = 0, len = keys.length; i < len; i++) {
            itemPromises.push((getItemKeyValue<T>).call(localforageInstance, keys[i]));
        }

        Promise.all(itemPromises)
            .then(function (keyValuePairs) {
                var result: ItemsResult<T> = {};
                for (var i = 0, len = keyValuePairs.length; i < len; i++) {
                    var keyValuePair = keyValuePairs[i];

                    result[keyValuePair.key] = keyValuePair.value;
                }
                resolve(result);
            })
            .catch(reject);
    });
    return promise;
}

export function getAllItemsUsingKeys<T>(this: LocalForageComplete) {
    var localforageInstance = this;
    return localforageInstance.keys().then(function (keys) {
        return localforageInstance.getItems<T>(keys);
    });
}

export function getAllItemsUsingKeysParallel<T>(this: LocalForageComplete) {
    var localforageInstance = this;
    return localforageInstance.keys().then(function (keys) {
        var itemPromises: Promise<T | null>[] = [];
        for (var i = 0, len = keys.length; i < len; i++) {
            itemPromises.push(localforageInstance.getItem<T>(keys[i]));
        }
        return Promise.all(itemPromises);
    });
}

export function getAllItemsUsingIterate<T>(this: LocalForageComplete) {
    var localforageInstance = this;
    var accumulator: ItemsResult<T> = {};
    return localforageInstance
        .iterate<T, void>(function (value, key) {
            accumulator[key] = value;
        })
        .then(function () {
            return accumulator;
        });
}
