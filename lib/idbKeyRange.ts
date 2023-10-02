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

const idbKeyRange = getIDBKeyRange()!;
export default idbKeyRange;
