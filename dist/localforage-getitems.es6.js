import localforage from '@luiz-monad/localforage';

function getSerializerPromise(localForageInstance) {
    const self = getSerializerPromise;
    if (self.result) {
        return self.result;
    }
    if (!localForageInstance || typeof localForageInstance.getSerializer !== 'function') {
        return Promise.reject(new Error('localforage.getSerializer() was not available! ' + 'localforage v1.4+ is required!'));
    }
    self.result = localForageInstance.getSerializer();
    return self.result;
}
function executeCallback(promise, callback) {
    if (callback) {
        promise.then(function (result) {
            callback(null, result);
        }, function (error) {
            callback(error, undefined);
        });
    }
}
function getItemKeyValue(key, callback) {
    const localforageInstance = this;
    const promise = localforageInstance.getItem(key).then(function (value) {
        return {
            key: key,
            value: value
        };
    });
    executeCallback(promise, callback);
    return promise;
}

function getItemsGeneric(keys) {
    const localforageInstance = this;
    const promise = new Promise(function (resolve, reject) {
        const itemPromises = [];
        for (let i = 0, len = keys.length; i < len; i++) {
            itemPromises.push((getItemKeyValue).call(localforageInstance, keys[i]));
        }
        Promise.all(itemPromises)
            .then(function (keyValuePairs) {
            const result = {};
            for (let i = 0, len = keyValuePairs.length; i < len; i++) {
                const keyValuePair = keyValuePairs[i];
                result[keyValuePair.key] = keyValuePair.value;
            }
            resolve(result);
        })
            .catch(reject);
    });
    return promise;
}
function getAllItemsUsingIterate() {
    const localforageInstance = this;
    const accumulator = {};
    return localforageInstance
        .iterate(function (value, key) {
        accumulator[key] = value;
    })
        .then(function () {
        return accumulator;
    });
}

function getIDBKeyRange() {
    if (typeof IDBKeyRange !== 'undefined') {
        return IDBKeyRange;
    }
    if (typeof webkitIDBKeyRange !== 'undefined') {
        return webkitIDBKeyRange;
    }
    if (typeof mozIDBKeyRange !== 'undefined') {
        return mozIDBKeyRange;
    }
    if (typeof OIDBKeyRange !== 'undefined') {
        return OIDBKeyRange;
    }
    if (typeof msIDBKeyRange !== 'undefined') {
        return msIDBKeyRange;
    }
}
const idbKeyRange = getIDBKeyRange();

function getItemsIndexedDB(keys) {
    keys = keys.slice();
    const localforageInstance = this;
    function comparer(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }
    const promise = new Promise(function (resolve, reject) {
        localforageInstance
            .ready()
            .then(function () {
            // Thanks https://hacks.mozilla.org/2014/06/breaking-the-borders-of-indexeddb/
            const dbInfo = localforageInstance._dbInfo;
            const store = dbInfo
                .db.transaction(dbInfo.storeName, 'readonly')
                .objectStore(dbInfo.storeName);
            const set = keys.sort(comparer);
            const keyRangeValue = idbKeyRange.bound(keys[0], keys[keys.length - 1], false, false);
            let breq;
            if ('getAll' in store) {
                const req = store.getAll(keyRangeValue);
                req.onsuccess = function () {
                    const result = {};
                    const avalue = req.result;
                    if (avalue !== undefined) {
                        for (let i = 0, len = avalue.length; i < len; i++) {
                            result[i.toString()] = avalue[i];
                        }
                    }
                    resolve(result);
                };
                breq = req;
            }
            else {
                const req = store.openCursor(keyRangeValue);
                const result = {};
                let i = 0;
                req.onsuccess = function () {
                    const cursor = req.result;
                    if (!cursor) {
                        resolve(result);
                        return;
                    }
                    const key = cursor.key;
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
                    }
                    else {
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

function getItemsWebsql(keys) {
    const localforageInstance = this;
    const promise = new Promise(function (resolve, reject) {
        localforageInstance
            .ready()
            .then(function () {
            return getSerializerPromise(localforageInstance);
        })
            .then(function (serializer) {
            const dbInfo = localforageInstance._dbInfo;
            dbInfo.db.transaction(function (t) {
                const queryParts = new Array(keys.length);
                for (let i = 0, len = keys.length; i < len; i++) {
                    queryParts[i] = '?';
                }
                t.executeSql(`SELECT * FROM ${dbInfo.storeName} WHERE (key IN (${queryParts.join(',')}))`, keys, function (t, results) {
                    const result = {};
                    const rows = results.rows;
                    for (let i = 0, len = rows.length; i < len; i++) {
                        const item = rows.item(i);
                        const svalue = item.value;
                        let value = null;
                        // Check to see if this is serialized content we need to
                        // unpack.
                        if (svalue) {
                            value = serializer.deserialize(svalue);
                        }
                        result[item.key] = value;
                    }
                    resolve(result);
                }, function (t, error) {
                    reject(error);
                    return false;
                });
            });
        })
            .catch(reject);
    });
    return promise;
}

function localforageGetItems(keys, callback) {
    const localforageInstance = this;
    let promise;
    if (!arguments.length || !keys) {
        promise = (getAllItemsUsingIterate).apply(localforageInstance);
    }
    else {
        const currentDriver = localforageInstance.driver();
        if (currentDriver === localforageInstance.INDEXEDDB) {
            promise = (getItemsIndexedDB).apply(localforageInstance, [keys]);
        }
        else if (currentDriver === localforageInstance.WEBSQL) {
            promise = (getItemsWebsql).apply(localforageInstance, [keys]);
        }
        else {
            promise = (getItemsGeneric).apply(localforageInstance, [keys]);
        }
    }
    executeCallback(promise, callback);
    return promise;
}
function extendPrototype(localforage) {
    const localforagePrototype = Object.getPrototypeOf(localforage);
    if (localforagePrototype) {
        localforagePrototype.getItems =
            localforageGetItems;
        localforagePrototype.getItems.indexedDB = function (keys) {
            return (getItemsIndexedDB).apply(this, [keys]);
        };
        localforagePrototype.getItems.websql = function (keys) {
            return (getItemsWebsql).apply(this, [keys]);
        };
        localforagePrototype.getItems.generic = function (keys) {
            return (getItemsGeneric).apply(this, [keys]);
        };
    }
    return localforage;
}
const extendPrototypeResult = extendPrototype(localforage);

export { extendPrototype, extendPrototypeResult, getItemsGeneric, getItemsIndexedDB, getItemsWebsql, localforageGetItems };
