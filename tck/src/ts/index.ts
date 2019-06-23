import { Publisher } from 'reactive-streams';
import * as bigInt from 'big-integer';
import { TestSubscriber, Receptacle } from './TestEnvironment';

const rule = (ruleNumber: string, fn: (() => void) | undefined): void =>
    fn
        ? test("Test Rule" + ruleNumber, fn)
        : test.skip("Skipped Rule" + ruleNumber, () => { });

const optional = (ruleNumber: string, fn: (() => void) | undefined): void => describe("Optional" + ruleNumber, () => rule(ruleNumber, fn));
const required = (ruleNumber: string, fn: (() => void) | undefined): void => describe("Required" + ruleNumber, () => rule(ruleNumber, fn));
const unverified = (ruleNumber: string, fn: () => void): void => describe("Untested" + ruleNumber, () => rule(ruleNumber, fn));

export function publisherVerification<T>(provider: PublisherTestProvider<T>) {
    describe("Publisher Verification Suite", () => {
        required("1.01", activePublisherTest(provider, 1, true, (publisher: Publisher<T>) => {

        }))
    })
}

function activePublisherTest<T>(provider: PublisherTestProvider<T>, elements: number, completionSignalRequired: boolean, testRun: (pub: Publisher<T>) => void): (() => void) | undefined {
    const numberOfElements = bigInt(provider.maxElementsFromPublisher())
    if (numberOfElements.lt(elements)) {
        console.warn(`Unable to run this test, as required elements nr: ${elements} is higher than supported by given producer: ${provider.maxElementsFromPublisher()}`);
    } else if (completionSignalRequired && numberOfElements.greaterOrEquals(bigInt("9223372036854775807"))) {
        console.warn("Unable to run this test, as it requires an onComplete signal, which this Publisher is unable to provide (as signalled by returning Long.MAX_VALUE from `maxElementsFromPublisher()`)");
    } else {
        const pub: Publisher<T> = provider.createPublisher(elements);
        return testRun.bind(pub) as () => void;
        // env.verifyNoAsyncErrorsNoDelay();
    }
}

abstract class PublisherTestProvider<T> {

    abstract createPublisher(elements: number): Publisher<T>

    abstract createFailedPublisher(): Publisher<T>

    public maxElementsFromPublisher(): string {
        return "9223372036854775806";
    }
}

class MyTest extends PublisherTestProvider<Number> {
    createPublisher(elements: number): Publisher<Number> {
        throw new Error("Method not implemented.");
    }

    createFailedPublisher(): Publisher<Number> {
        throw new Error("Method not implemented.");
    }
}

// it("test", publisherVerification.bind(this, new MyTest()));