import {
    Callback,
    Forage,
    ILocalForage,
    LocalForageComplete,
    OptionalDropInstanceDriver,
    Options
} from '@luiz-monad/localforage/dist/types';
import serializer from '@luiz-monad/localforage/dist/utils/serializer';

export function getSerializerPromise<DbInfo extends Options>(
    localForageInstance: Forage<DbInfo> & ILocalForage
): Promise<typeof serializer> {
    const self = getSerializerPromise as { result?: Promise<typeof serializer> };
    if (self.result) {
        return self.result;
    }
    if (!localForageInstance || typeof localForageInstance.getSerializer !== 'function') {
        return Promise.reject(
            new Error(
                'localforage.getSerializer() was not available! ' + 'localforage v1.4+ is required!'
            )
        );
    }
    self.result = localForageInstance.getSerializer();
    return self.result;
}

export function getDriverPromise(
    localForageInstance: LocalForageComplete,
    driverName: string
): Promise<OptionalDropInstanceDriver> {
    const self = getDriverPromise as {
        result?: Record<string, Promise<OptionalDropInstanceDriver>>;
    };
    self.result = self.result || {};
    if (driverName in self.result) {
        return self.result[driverName];
    }
    if (!localForageInstance || typeof localForageInstance.getDriver !== 'function') {
        return Promise.reject(
            new Error(
                'localforage.getDriver() was not available! ' + 'localforage v1.4+ is required!'
            )
        );
    }
    self.result[driverName] = localForageInstance.getDriver(driverName);
    return self.result[driverName];
}

export function executeCallback<T>(promise: Promise<T>, callback?: Callback<T>) {
    if (callback) {
        promise.then(
            function (result) {
                callback(null, result);
            },
            function (error) {
                (callback as Function)(error);
            }
        );
    }
}

export type KeyValue<T> = { key: string; value: T | null };

export function getItemKeyValue<T>(
    this: OptionalDropInstanceDriver,
    key: string,
    callback?: Callback<KeyValue<T>>
) {
    var localforageInstance = this;
    var promise = localforageInstance.getItem<T>(key).then(function (value) {
        return {
            key: key,
            value: value
        };
    });
    executeCallback(promise, callback);
    return promise;
}
