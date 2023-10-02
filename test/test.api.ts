import { expect } from 'chai';
import 'localforage-getitems';

mocha.setup({ asyncOnly: true });

const DRIVERS = [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE];

const getItemsFn = localforage.getItems;
const GETITEMDRIVERS = [getItemsFn.indexedDB, getItemsFn.websql, getItemsFn.generic];

const SUPPORTED_DRIVERS = DRIVERS.filter(function (driverName) {
    return localforage.supports(driverName);
});

const driverApiMethods = ['getItems'];

const indexedDB =
    // eslint-disable-next-line no-use-before-define
    global.indexedDB ||
    window.indexedDB ||
    window.webkitIndexedDB ||
    window.mozIndexedDB ||
    window.OIndexedDB ||
    window.msIndexedDB;

describe('localForage', function () {
    it('errors when a requested driver is not found [callback]', function () {
        return localforage
            .getDriver('UnknownDriver', null!, function (error) {
                expect(error).to.be.instanceof(Error);
                expect(error.message).to.be.eq('Driver not found.');
                expect(localforage.getItems).to.be.eq(localforage.getItems.generic);
            })
            .then(null, () => {});
    });

    it('errors when a requested driver is not found [promise]', function () {
        return localforage.getDriver('UnknownDriver').then(null, function (error) {
            expect(error).to.be.instanceof(Error);
            expect(error.message).to.be.eq('Driver not found.');
            expect(localforage.getItems).to.be.eq(localforage.getItems.generic);
        });
    });

    describe('createInstance()', function () {
        it('works', function () {
            const oldLogCount = console.infoLogs.length;
            const localforage2 = localforage.createInstance();
            const localforage3 = localforage.createInstance();

            return Promise.all([
                localforage.ready(),
                localforage2.ready(),
                localforage3.ready()
            ]).then(function () {
                expect(console.infoLogs.length).to.be.eq(oldLogCount);
                expect(localforage3.getItems).to.be.eq(
                    GETITEMDRIVERS[DRIVERS.indexOf(localforage3.driver()!)]
                );
            });
        });
    });
});

SUPPORTED_DRIVERS.forEach(function (driverName) {
    describe(driverName + ' driver', function () {
        this.timeout(30000);

        before(function () {
            return localforage.setDriver(driverName);
        });

        beforeEach(function () {
            localStorage.clear();
            return localforage.ready().then(function () {
                return new Promise((resolve) => localforage.clear(resolve));
            });
        });

        it('has a localStorage API extension', async function () {
            expect(localforage.getItems).to.be.a('function');
        });

        if (driverName === localforage.INDEXEDDB) {
            const localforageIDB =
                localforage as any as import('@luiz-monad/localforage/dist/drivers/indexeddb.d.ts').Module;

            describe('Blob support', function () {
                const blob = new Blob([''], { type: 'image/png' });

                it('check for Blob', function () {
                    return localforage.setItem('key', blob).then(function () {
                        return localforage.getItems(['key']).then(function (value) {
                            expect(value).to.be.eq(blob);
                        });
                    });
                });
            });

            describe('recover (reconnect) from IDBDatabase InvalidStateError', function () {
                beforeEach(function () {
                    return Promise.all([
                        localforage.setItem('key', 'value1'),
                        localforage.setItem('key1', 'value1'),
                        localforage.setItem('key2', 'value2'),
                        localforage.setItem('key3', 'value3')
                    ]).then(function () {
                        localforageIDB._dbInfo.db!.close();
                    });
                });

                it('retrieves an item from the storage', function () {
                    return localforage
                        .getItems(['key', 'key1', 'key2', 'key3'])
                        .then(function (value) {
                            expect(value).to.be.eq('value1');
                        });
                });
            });
        }

        it('returns multiple items [callback]', function () {
            return Promise.all([
                localforage.setItem('key', 'value1'),
                localforage.setItem('key1', 'value1'),
                localforage.setItem('key2', 'value2'),
                localforage.setItem('key3', 'value3')
            ]).then(function () {
                return localforage.getItems(['key', 'key1', 'key2', 'key3'], function (err, value) {
                    expect(value).to.be.eq(null);
                });
            });
        });
        it('returns multiple items [promise]', function () {
            return Promise.all([
                localforage.setItem('key', 'value1'),
                localforage.setItem('key1', 'value1'),
                localforage.setItem('key2', 'value2'),
                localforage.setItem('key3', 'value3')
            ]).then(function () {
                return localforage.getItems(['key', 'key1', 'key2', 'key3']).then(function (value) {
                    expect(value).to.be.eq(null);
                });
            });
        });

        // Test for https://github.com/mozilla/localForage/issues/175
        it('nested getItems inside clear works [callback]', function () {
            return localforage.setItem('hello', 'Hello World !', function () {
                return localforage.clear(function () {
                    return localforage.getItems(['hello'], function (secondValue) {
                        expect(secondValue).to.be.eq(null);
                    });
                });
            });
        });
        it('nested getItems inside clear works [promise]', function () {
            return localforage
                .setItem('hello', 'Hello World !')
                .then(function () {
                    return localforage.clear();
                })
                .then(function () {
                    return localforage.getItems(['hello']);
                })
                .then(function (secondValue) {
                    expect(secondValue).to.be.eq(null);
                });
        });

        // Because localStorage doesn't support saving the `undefined` type, we
        // always return `null` so that localForage is consistent across
        // browsers.
        // https://github.com/mozilla/localForage/pull/42
        it('returns null for undefined key [callback]', function () {
            return localforage.getItems(['key'], function (err, value) {
                expect(value).to.be.eq(null);
            });
        });

        it('returns null for undefined key [promise]', function () {
            return localforage.getItems(['key']).then(function (value) {
                expect(value).to.be.eq(null);
            });
        });

        it('returns null for a non-existant key [callback]', function () {
            return localforage.getItems(['undef'], function (err, value) {
                expect(value).to.be.eq(null);
            });
        });
        it('returns null for a non-existant key [promise]', function () {
            return localforage.getItems(['undef']).then(function (value) {
                expect(value).to.be.eq(null);
            });
        });

        // Deal with non-string keys, see issue #250
        // https://github.com/mozilla/localForage/issues/250
        it('casts an undefined key to a String', function () {
            return localforage
                .setItem(undefined!, 'goodness!')
                .then(function (value) {
                    expect(value).to.be.eq('goodness!');

                    return localforage.getItems(undefined!);
                })
                .then(function (value) {
                    expect(value).to.be.eq('goodness!');

                    return localforage.removeItem(undefined!);
                })
                .then(function () {
                    return localforage.length();
                })
                .then(function (length) {
                    expect(length).to.be.eq(0);
                });
        });

        it('casts a null key to a String', function () {
            return localforage
                .setItem(null!, 'goodness!')
                .then(function (value) {
                    expect(value).to.be.eq('goodness!');

                    return localforage.getItems(null!);
                })
                .then(function (value) {
                    expect(value).to.be.eq('goodness!');

                    return localforage.removeItem(null!);
                })
                .then(function () {
                    return localforage.length();
                })
                .then(function (length) {
                    expect(length).to.be.eq(0);
                });
        });

        it('casts a float key to a String', function () {
            return localforage
                .setItem(537.35737 as any, 'goodness!')
                .then(function (value) {
                    expect(value).to.be.eq('goodness!');

                    return localforage.getItems(537.35737 as any);
                })
                .then(function (value) {
                    expect(value).to.be.eq('goodness!');

                    return localforage.removeItem(537.35737 as any);
                })
                .then(function () {
                    return localforage.length();
                })
                .then(function (length) {
                    expect(length).to.be.eq(0);
                });
        });

        it('is retrieved by getDriver [callback]', function () {
            return localforage.getDriver(driverName, function (driver) {
                expect(typeof driver).to.be.eq('object');
                driverApiMethods.forEach(function (methodName) {
                    expect(typeof driver[methodName as keyof typeof driver]).to.be.eq('function');
                });
                expect(driver._driver).to.be.eq(driverName);
            });
        });

        it('is retrieved by getDriver [promise]', function () {
            return localforage.getDriver(driverName).then(function (driver) {
                expect(typeof driver).to.be.eq('object');
                driverApiMethods.forEach(function (methodName) {
                    expect(typeof driver[methodName as keyof typeof driver]).to.be.eq('function');
                });
                expect(driver._driver).to.be.eq(driverName);
            });
        });
    });

    function prepareStorage(storageName: string) {
        // Delete IndexedDB storages (start from scratch)
        // Refers to issue #492 - https://github.com/mozilla/localForage/issues/492
        if (driverName === localforage.INDEXEDDB) {
            return new Promise(function (resolve) {
                indexedDB.deleteDatabase(storageName).onsuccess = resolve;
            });
        }

        // Otherwise, do nothing
        return Promise.resolve();
    }

    describe(driverName + ' driver multiple instances', function () {
        'use strict';

        this.timeout(30000);

        let localforage2 = {} as LocalForageDriver;
        let localforage3 = {} as LocalForageDriver;

        before(function () {
            return prepareStorage('storage2').then(function () {
                localforage2 = localforage.createInstance({
                    name: 'storage2',
                    // We need a small value here
                    // otherwise local PhantomJS test
                    // will fail with SECURITY_ERR.
                    // TravisCI seem to work fine though.
                    size: 1024,
                    storeName: 'storagename2'
                });

                // Same name, but different storeName since this has been
                // malfunctioning before w/ IndexedDB.
                localforage3 = localforage.createInstance({
                    name: 'storage2',
                    // We need a small value here
                    // otherwise local PhantomJS test
                    // will fail with SECURITY_ERR.
                    // TravisCI seem to work fine though.
                    size: 1024,
                    storeName: 'storagename3'
                });

                return Promise.all([
                    localforage.setDriver(driverName),
                    localforage2.setDriver(driverName),
                    localforage3.setDriver(driverName)
                ]);
            });
        });

        beforeEach(function () {
            return Promise.all([localforage.clear(), localforage2.clear(), localforage3.clear()]);
        });

        it('is not be able to access values of other instances', function () {
            return Promise.all([
                localforage.setItem('key1', 'value1a'),
                localforage2.setItem('key2', 'value2a'),
                localforage3.setItem('key3', 'value3a')
            ]).then(function () {
                return Promise.all([
                    localforage.getItems(['key2']).then(function (value) {
                        expect(value).to.be.eq(null);
                    }),
                    localforage2.getItems(['key1']).then(function (value) {
                        expect(value).to.be.eq(null);
                    }),
                    localforage2.getItems(['key3']).then(function (value) {
                        expect(value).to.be.eq(null);
                    }),
                    localforage3.getItems(['key2']).then(function (value) {
                        expect(value).to.be.eq(null);
                    })
                ]);
            });
        });

        it('retrieves the proper value when using the same key with other instances', function () {
            return Promise.all([
                localforage.setItem('key', 'value1'),
                localforage2.setItem('key', 'value2'),
                localforage3.setItem('key', 'value3')
            ]).then(function () {
                return Promise.all([
                    localforage.getItems(['key']).then(function (value) {
                        expect(value).to.be.eq('value1');
                    }),
                    localforage2.getItems(['key']).then(function (value) {
                        expect(value).to.be.eq('value2');
                    }),
                    localforage3.getItems(['key']).then(function (value) {
                        expect(value).to.be.eq('value3');
                    })
                ]);
            });
        });
    });

    // Refers to issue #492 - https://github.com/mozilla/localForage/issues/492
    describe(driverName + ' driver multiple instances (concurrent on same database)', function () {
        'use strict';

        this.timeout(30000);

        before(function () {
            return Promise.all([
                prepareStorage('storage3'),
                prepareStorage('commonStorage'),
                prepareStorage('commonStorage2'),
                prepareStorage('commonStorage3')
            ]);
        });

        it('chains operation on multiple stores', function () {
            const localforage1 = localforage.createInstance({
                name: 'storage3',
                storeName: 'store1',
                size: 1024
            });

            const localforage2 = localforage.createInstance({
                name: 'storage3',
                storeName: 'store2',
                size: 1024
            });

            const localforage3 = localforage.createInstance({
                name: 'storage3',
                storeName: 'store3',
                size: 1024
            });

            const promise1 = localforage1
                .setItem('key', 'value1')
                .then(function () {
                    return localforage1.getItems(['key']);
                })
                .then(function (value) {
                    expect(value).to.be.eq('value1');
                });

            const promise2 = localforage2
                .setItem('key', 'value2')
                .then(function () {
                    return localforage2.getItems(['key']);
                })
                .then(function (value) {
                    expect(value).to.be.eq('value2');
                });

            const promise3 = localforage3
                .setItem('key', 'value3')
                .then(function () {
                    return localforage3.getItems(['key']);
                })
                .then(function (value) {
                    expect(value).to.be.eq('value3');
                });

            return Promise.all([promise1, promise2, promise3]);
        });

        it('works on multiple instances of the same store', function () {
            let localforage1 = {} as LocalForageDriver;
            let localforage2 = {} as LocalForageDriver;
            let localforage3 = {} as LocalForageDriver;

            return Promise.resolve()
                .then(function () {
                    localforage1 = localforage.createInstance({
                        name: 'commonStorage',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage1.ready();
                })
                .then(function () {
                    localforage2 = localforage.createInstance({
                        name: 'commonStorage',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage2.ready();
                })
                .then(function () {
                    localforage3 = localforage.createInstance({
                        name: 'commonStorage',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage3.ready();
                })
                .then(function () {
                    return Promise.resolve()
                        .then(function () {
                            return localforage1
                                .setItem('key1', 'value1')
                                .then(function () {
                                    return localforage1.getItems(['key1']);
                                })
                                .then(function (value) {
                                    expect(value).to.be.eq('value1');
                                });
                        })
                        .then(function () {
                            return localforage2
                                .setItem('key2', 'value2')
                                .then(function () {
                                    return localforage2.getItems(['key2']);
                                })
                                .then(function (value) {
                                    expect(value).to.be.eq('value2');
                                });
                        })
                        .then(function () {
                            return localforage3
                                .setItem('key3', 'value3')
                                .then(function () {
                                    return localforage3.getItems(['key3']);
                                })
                                .then(function (value) {
                                    expect(value).to.be.eq('value3');
                                });
                        });
                });
        });

        it('works on multiple instances of the same store and concurrently', function () {
            let localforage1 = {} as LocalForageDriver;
            let localforage2 = {} as LocalForageDriver;
            let localforage3 = {} as LocalForageDriver;
            let localforage3b = {} as LocalForageDriver;

            return Promise.resolve()
                .then(function () {
                    localforage1 = localforage.createInstance({
                        name: 'commonStorage2',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage1.ready();
                })
                .then(function () {
                    localforage2 = localforage.createInstance({
                        name: 'commonStorage2',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage2.ready();
                })
                .then(function () {
                    localforage3 = localforage.createInstance({
                        name: 'commonStorage2',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage3.ready();
                })
                .then(function () {
                    localforage3b = localforage.createInstance({
                        name: 'commonStorage2',
                        storeName: 'commonStore',
                        size: 1024
                    });
                    return localforage3b.ready();
                })
                .then(function () {
                    const promise1 = localforage1
                        .setItem('key1', 'value1')
                        .then(function () {
                            return localforage1.getItems(['key1']);
                        })
                        .then(function (value) {
                            expect(value).to.be.eq('value1');
                        });

                    const promise2 = localforage2
                        .setItem('key2', 'value2')
                        .then(function () {
                            return localforage2.getItems(['key2']);
                        })
                        .then(function (value) {
                            expect(value).to.be.eq('value2');
                        });

                    const promise3 = localforage3
                        .setItem('key3', 'value3')
                        .then(function () {
                            return localforage3.getItems(['key3']);
                        })
                        .then(function (value) {
                            expect(value).to.be.eq('value3');
                        });

                    const promise4 = localforage3b
                        .setItem('key3', 'value3')
                        .then(function () {
                            return localforage3.getItems(['key3']);
                        })
                        .then(function (value) {
                            expect(value).to.be.eq('value3');
                        });

                    return Promise.all([promise1, promise2, promise3, promise4]);
                });
        });

        it('can create multiple instances of the same store concurrently', function () {
            const localforage1 = localforage.createInstance({
                name: 'commonStorage3',
                storeName: 'commonStore',
                size: 1024
            });

            const localforage2 = localforage.createInstance({
                name: 'commonStorage3',
                storeName: 'commonStore',
                size: 1024
            });

            const localforage3 = localforage.createInstance({
                name: 'commonStorage3',
                storeName: 'commonStore',
                size: 1024
            });

            const localforage3b = localforage.createInstance({
                name: 'commonStorage3',
                storeName: 'commonStore',
                size: 1024
            });

            const promise1 = localforage1
                .setItem('key1', 'value1')
                .then(function () {
                    return localforage1.getItems(['key1']);
                })
                .then(function (value) {
                    expect(value).to.be.eq('value1');
                });

            const promise2 = localforage2
                .setItem('key2', 'value2')
                .then(function () {
                    return localforage2.getItems(['key2']);
                })
                .then(function (value) {
                    expect(value).to.be.eq('value2');
                });

            const promise3 = localforage3
                .setItem('key3', 'value3')
                .then(function () {
                    return localforage3.getItems(['key3']);
                })
                .then(function (value) {
                    expect(value).to.be.eq('value3');
                });

            const promise4 = localforage3b
                .setItem('key3', 'value3')
                .then(function () {
                    return localforage3.getItems(['key3']);
                })
                .then(function (value) {
                    expect(value).to.be.eq('value3');
                });

            return Promise.all([promise1, promise2, promise3, promise4]);
        });
    });

    describe(driverName + ' driver when the callback throws an Error', function () {
        'use strict';

        const testObj = {
            throwFunc: function () {
                testObj.throwFuncCalls++;
                throw new Error('Thrown test error');
            },
            throwFuncCalls: 0
        };

        beforeEach(function () {
            testObj.throwFuncCalls = 0;
        });

        it('resolves the promise of getItems()', function () {
            return localforage.getItems(['key'], testObj.throwFunc).then(function () {
                expect(testObj.throwFuncCalls).to.be.eq(1);
            });
        });
    });

    describe(driverName + ' driver when ready() gets rejected', function () {
        'use strict';

        this.timeout(30000);

        let _oldReady: typeof localforage.ready;

        beforeEach(function () {
            _oldReady = localforage.ready;
            localforage.ready = function () {
                return Promise.reject(true);
            };
        });

        afterEach(function () {
            localforage.ready = _oldReady;
            _oldReady = null!;
        });

        driverApiMethods.forEach(function (methodName) {
            it('rejects ' + methodName + '() promise', function () {
                return (localforage as any)[methodName]().then(null, function (err: any) {
                    expect(err).to.be.true;
                });
            });
        });
    });
});

DRIVERS.forEach(function (driverName, driverIndex) {
    describe(driverName + ' driver instance', function () {
        it('creates a new instance and sets the driver', function () {
            const localforage2 = localforage.createInstance({
                name: 'storage2',
                driver: driverName,
                // We need a small value here
                // otherwise local PhantomJS test
                // will fail with SECURITY_ERR.
                // TravisCI seem to work fine though.
                size: 1024,
                storeName: 'storagename2'
            });

            // since config actually uses setDriver which is async,
            // and since driver() and supports() are not defered (are sync),
            // we have to wait till an async method returns
            return localforage2.getItems().then(
                function () {
                    expect(localforage2.driver()).to.be.eq(driverName);
                    expect(localforage2.getItems).to.be.eq(GETITEMDRIVERS[driverIndex]);
                },
                function () {}
            );
        });
    });
});

describe('unsupported driver', function () {
    const dummyStorageDriver: import('@luiz-monad/localforage/dist/types').OptionalDropInstanceDriver = {
        _driver: 'dummyStorageDriver',
        _initStorage: localforage._initStorage,
        _support: true,
        iterate: localforage.iterate,
        getItem: localforage.getItem,
        setItem: localforage.setItem,
        removeItem: localforage.removeItem,
        clear: localforage.clear,
        length: localforage.length,
        key: localforage.key,
        keys: localforage.keys,
        dropInstance: localforage.dropInstance
    };
    
    it('sets a custom driver', function () {
        return localforage.defineDriver(dummyStorageDriver, function () {
            return localforage.setDriver(dummyStorageDriver._driver, function () {
                expect(localforage.driver()).to.be.eq(dummyStorageDriver._driver);
                expect(localforage.getItems).to.be.eq(localforage.getItems.generic);
            });
        });
    });

    it('sets a custom driver [promise]', function () {
        return localforage
            .defineDriver(dummyStorageDriver)
            .then(function () {
                return localforage.setDriver(dummyStorageDriver._driver);
            })
            .then(function () {
                expect(localforage.driver()).to.be.eq(dummyStorageDriver._driver);
                expect(localforage.getItems).to.be.eq(localforage.getItems.generic);
            });
    });
});
