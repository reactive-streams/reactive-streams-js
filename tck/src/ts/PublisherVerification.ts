import { Publisher } from 'reactive-streams';
import * as bigInt from 'big-integer';
import { ManualSubscriber } from './TestEnvironment';

const rule = (ruleNumber: string, fn: (() => void) | undefined): void =>
    fn
        ? test("Test Rule" + ruleNumber, fn)
        : test.skip("Skipped Rule" + ruleNumber, () => { });

const optional = (ruleNumber: string, fn: (() => void) | undefined): void => describe("Optional" + ruleNumber, () => rule(ruleNumber, fn));
const required = (ruleNumber: string, fn: (() => void) | undefined): void => describe("Required" + ruleNumber, () => fn ? test("Test Rule" + ruleNumber, fn) : fail());
const unverified = (ruleNumber: string, fn: () => void): void => describe("Untested" + ruleNumber, () => rule(ruleNumber, fn));

export function publisherVerification<T>(provider: PublisherTestProvider<T>) {
    describe("Publisher Verification Suite", () => {
        required("1.01", activePublisherTest(provider, 1, true, async (publisher: Publisher<T>) => {

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
    }
}

export abstract class PublisherTestProvider<T> {
    abstract createPublisher(elements: number): Publisher<T>

    public maxElementsFromPublisher(): string {
        return "9223372036854775806";
    }
}


export async function required_createPublisher1MustProduceAStreamOfExactly1Element<T>(publisher: Publisher<T>): Promise<void> {
    const sub: ManualSubscriber<T> = new ManualSubscriber();
    publisher.subscribe(sub);

    await sub.expectSubscription()
    await sub.requestNextElement();
    await sub.requestCompletion();
}

async function required_createPublisher3MustProduceAStreamOfExactly3Elements(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function required_spec101_subscriptionRequestMustResultInTheCorrectNumberOfProducedElements(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function required_spec102_maySignalLessThanRequestedAndTerminateSubscription(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function stochastic_spec103_mustSignalOnMethodsSequentially(): Promise<void> {
    throw new Error("Method not implemented.");
}

async function required_spec105_mustSignalOnCompleteWhenFiniteStreamTerminates(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function optional_spec105_emptyStreamMustTerminateBySignallingOnComplete(): Promise<void> {
    throw new Error("Method not implemented.");
}
// untested_spec106_mustConsiderSubscriptionCancelledAfterOnErrorOrOnCompleteHasBeenCalled(): Promise<void> {
//     throw new Error("Method not implemented.");
// }
async function required_spec107_mustNotEmitFurtherSignalsOnceOnCompleteHasBeenSignalled(): Promise<void> {
    throw new Error("Method not implemented.");
}
// untested_spec107_mustNotEmitFurtherSignalsOnceOnErrorHasBeenSignalled(): Promise<void> {
//     throw new Error("Method not implemented.");
// }
// untested_spec108_possiblyCanceledSubscriptionShouldNotReceiveOnErrorOrOnCompleteSignals(): Promise<void> {
//     throw new Error("Method not implemented.");
// }
async function required_spec109_mustIssueOnSubscribeForNonNullSubscriber(): Promise<void> {
    throw new Error("Method not implemented.");
}
// untested_spec109_subscribeShouldNotThrowNonFatalThrowable(): Promise<void> {
//     throw new Error("Method not implemented.");
// }
async function required_spec109_subscribeThrowNPEOnNullSubscriber(): Promise<void> {
    throw new Error("Method not implemented.");
}

// untested_spec110_rejectASubscriptionRequestIfTheSameSubscriberSubscribesTwice(): Promise<void> {
//     throw new Error("Method not implemented.");
// }
async function optional_spec111_maySupportMultiSubscribe(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function optional_spec111_registeredSubscribersMustReceiveOnNextOrOnCompleteSignals(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function optional_spec111_multicast_mustProduceTheSameElementsInTheSameSequenceToAllOfItsSubscribersWhenRequestingOneByOne(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function optional_spec111_multicast_mustProduceTheSameElementsInTheSameSequenceToAllOfItsSubscribersWhenRequestingManyUpfront(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function optional_spec111_multicast_mustProduceTheSameElementsInTheSameSequenceToAllOfItsSubscribersWhenRequestingManyUpfrontAndCompleteAsExpected(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function required_spec302_mustAllowSynchronousRequestCallsFromOnNextAndOnSubscribe(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function required_spec303_mustNotAllowUnboundedRecursion(): Promise<void> {
    throw new Error("Method not implemented.");
}
// untested_spec304_requestShouldNotPerformHeavyComputations(): Promise<void> {
//     throw new Error("Method not implemented.");
// }
// untested_spec305_cancelMustNotSynchronouslyPerformHeavyComputation(): Promise<void> {
//     throw new Error("Method not implemented.");
// }
async function required_spec306_afterSubscriptionIsCancelledRequestMustBeNops(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function required_spec307_afterSubscriptionIsCancelledAdditionalCancelationsMustBeNops(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function required_spec309_requestZeroMustSignalIllegalArgumentException(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function required_spec309_requestNegativeNumberMustSignalIllegalArgumentException(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function optional_spec309_requestNegativeNumberMaySignalIllegalArgumentExceptionWithSpecificMessage(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function required_spec312_cancelMustMakeThePublisherToEventuallyStopSignaling(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function required_spec313_cancelMustMakeThePublisherEventuallyDropAllReferencesToTheSubscriber(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function required_spec317_mustSupportAPendingElementCountUpToLongMaxValue(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function required_spec317_mustSupportACumulativePendingElementCountUpToLongMaxValue(): Promise<void> {
    throw new Error("Method not implemented.");
}
async function required_spec317_mustNotSignalOnErrorWhenPendingAboveLongMaxValue(): Promise<void> {
    throw new Error("Method not implemented.");
}

