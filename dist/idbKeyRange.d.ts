declare const idbKeyRange: {
    new (): IDBKeyRange;
    prototype: IDBKeyRange;
    bound(lower: any, upper: any, lowerOpen?: boolean | undefined, upperOpen?: boolean | undefined): IDBKeyRange;
    lowerBound(lower: any, open?: boolean | undefined): IDBKeyRange;
    only(value: any): IDBKeyRange;
    upperBound(upper: any, open?: boolean | undefined): IDBKeyRange;
};
export default idbKeyRange;
