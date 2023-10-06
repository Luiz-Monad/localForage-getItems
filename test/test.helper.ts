import { util } from 'chai';
import { SinonSpiedMember } from 'sinon';

type SinonSpy = SinonSpiedMember<(...args: any[]) => any> & { proxy: SinonSpy };

function getInstanceCalls(this: Chai.AssertionStatic, instance: any, msg?: string) {
    if (msg) {
        util.flag(this, 'message', msg);
    }
    const obj = util.flag(this, 'object') as SinonSpy;
    return obj.getCalls();
}

function getMessage(this: Chai.AssertionStatic, msg: string, args: any[]) {
    const spy = util.flag(this, 'object') as SinonSpy;
    return (spy.printf || spy.proxy.printf).apply(spy, [msg, ...args]);
}

function calledOnceOn(this: Chai.AssertionStatic, instance: any, msg?: string) {
    const action = 'been called exactly once with %1 as this';
    const expected = 'but it was called with %t instead';
    const affirmative = `expected %n to have ${action}, ${expected}`;
    const negative = `expected %n to not have ${action}`;
    const calls = getInstanceCalls.call(this, instance, msg);
    const instanceCalls = calls.filter((call) => (call.args[0] as any) === instance);
    this.assert(
        instanceCalls.length === 1,
        getMessage.call(this, affirmative, arguments as any),
        getMessage.call(this, negative, arguments as any),
        instance
    );
}

const chaiPlugin: Chai.ChaiPlugin = (chai, utils) => {
    utils.addMethod(chai.Assertion.prototype, 'calledOnceOn', calledOnceOn);
};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    export namespace Chai {
        interface LanguageChains {
            always: Assertion;
        }

        interface Assertion {
            calledOnceOn: Assertion;
        }
    }
}

export default chaiPlugin;
