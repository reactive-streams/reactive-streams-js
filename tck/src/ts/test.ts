import { Publisher, Subscriber, Subscription } from 'reactive-streams';

const rule = (ruleNumber: string, fn: (() => void) | undefined): void =>
    fn
        ? describe("Test Rule" + ruleNumber, fn)
        : describe.skip("Skipped Rule" + ruleNumber, () => { });

const optional = (ruleNumber: string, fn: () => void): void => describe("Optional" + ruleNumber, fn);
const required = (ruleNumber: string, fn: () => void): void => describe("Rule" + ruleNumber, fn);
const unverified = (ruleNumber: string, fn: () => void): void => describe("Rule" + ruleNumber, fn);

const verifyPublisher: <T> (publisher: Publisher<T>) => void = (publisher) => {
    expect(publisher).toContain
}

export function publisherVerification<T>(provider: PublisherTestProvider<T>) {
    describe("Publisher Verification Suite", () => {
        rule("1.01", activePublisherTest(provider, 1, true, (publisher: Publisher<T>) => {

        }))
    })
}

function activePublisherTest<T>(provider: PublisherTestProvider<T>, elements: number, completionSignalRequired: boolean, testRun: (pub: Publisher<T>) => void): (() => void) | undefined {
    if (elements > provider.maxElementsFromPublisher()) {
        console.exception(`Unable to run this test, as required elements nr: ${elements} is higher than supported by given producer: ${provider.maxElementsFromPublisher()}`);
    } else if (completionSignalRequired && provider.maxElementsFromPublisher() >= 9223372036854775807) {
        console.exception("Unable to run this test, as it requires an onComplete signal, which this Publisher is unable to provide (as signalled by returning Long.MAX_VALUE from `maxElementsFromPublisher()`)");
    } else {
        const pub: Publisher<T> = provider.createPublisher(elements);
        return testRun.bind(pub) as () => void;
        // env.verifyNoAsyncErrorsNoDelay();
    }
}


abstract class PublisherTestProvider<T> {

    abstract createPublisher(elements: number): Publisher<T>

    abstract createFailedPublisher(): Publisher<T>

    public maxElementsFromPublisher(): number {
        return 9223372036854775806;
    }
}

class TestSubscriber<T> implements Subscriber<T> {
    protected subscription!: Subscription;

    // protected final TestEnvironment env;

    // public TestSubscriber(TestEnvironment env) {
    //   this.env = env;
    //   subscription = new Promise<Subscription>(env);
    // }

    onError(cause: Error): void {
        console.error(`Unexpected Subscriber::onError(${cause})`);
        fail(cause);
    }

    onComplete(): void {
        console.error("Unexpected Subscriber::onComplete()");
        fail();
    }

    onNext(element: T): void {
        console.error(`Unexpected Subscriber::onNext(${element})`);
        fail();
    }

    onSubscribe(subscription: Subscription): void {
        console.error(`Unexpected Subscriber::onSubscribe${subscription}`);
        fail();
    }

    cancel() {
        if (this.subscription) {
            this.subscription.cancel();
        } else {
            console.error("Cannot cancel a subscription before having received it");
            fail();
        }
    }
}