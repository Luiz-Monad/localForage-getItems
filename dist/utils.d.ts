import { Callback, Forage, ILocalForage, LocalForageComplete, OptionalDropInstanceDriver, Options } from '@luiz-monad/localforage/dist/types';
import serializer from '@luiz-monad/localforage/dist/utils/serializer';
export declare function getSerializerPromise<DbInfo extends Options>(localForageInstance: Forage<DbInfo> & ILocalForage): Promise<typeof serializer>;
export declare function getDriverPromise(localForageInstance: LocalForageComplete, driverName: string): Promise<OptionalDropInstanceDriver>;
export declare function executeCallback<T>(promise: Promise<T>, callback?: Callback<T>): void;
export type KeyValue<T> = {
    key: string;
    value: T | null;
};
export declare function getItemKeyValue<T>(this: OptionalDropInstanceDriver, key: string, callback?: Callback<KeyValue<T>>): Promise<{
    key: string;
    value: T | null;
}>;
