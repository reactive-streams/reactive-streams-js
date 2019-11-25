import { Publisher, Subscriber, Subscription } from "reactive-streams";
import { required_createPublisher1MustProduceAStreamOfExactly1Element } from "../PublisherVerification";
import * as bigInt from 'big-integer';

class NonePublisher implements Publisher<any> {
    subscribe<S extends any>(s: Subscriber<S>): void { }
}



class RangePublisher implements Publisher<number> {

    constructor(private readonly start: number, private readonly end: number) {}

    subscribe<S extends number>(s: Subscriber<S>): void {
        s.onSubscribe(new RangeSubscription(s, this.start, this.end));
    }
}

class RangePublisherWithDoubleSubscription implements Publisher<number> {
    constructor(private readonly start: number, private readonly end: number) {}

    subscribe<S extends number>(s: Subscriber<S>): void {
        s.onSubscribe(new RangeSubscription(s, this.start, this.end));
        s.onSubscribe(new RangeSubscription(s, this.start, this.end));
    }
}

class RangePublisherWithIncorrectSubscription implements Publisher<number> {

    constructor(private readonly start: number, private readonly end: number) {}

    subscribe<S extends number>(s: Subscriber<S>): void {
        s.onSubscribe({} as any);
    }
}

class RangeSubscription implements Subscription {

    private current: number;
    private cancelled: boolean = false;

    private requested: bigInt.BigInteger = bigInt(0);
    
    constructor(private readonly actual: Subscriber<number>, private readonly start: number, private readonly end: number) {
        this.current = start;
    }

    request(n: number): void {
        if (this.cancelled) {
            return;
        }

        if (n <= 0) {
            this.cancel();
            this.actual.onError(new RangeError("§3.9 violated"));
            return;
        }

        let { requested, current, end , actual } = this;

        this.requested = requested.add(n);

        if (requested.greater(0)) {
            return;
        }

        requested = this.requested;

        let sent: number = 0;

        while (true) {
            for (; sent < Number.MAX_SAFE_INTEGER && requested.greater(sent) && current < end; sent++, current++) {
                if (this.cancelled) {
                    return;
                }

                actual.onNext(current);
            }

            if (this.cancelled) {
                return;
            }
            
            if (current == end) {
                actual.onComplete();
                return;
            }

            this.requested = requested = requested.add(-sent);

            if (requested.isZero()) {
                return;
            }

            sent = 0;
        }
    }

    cancel(): void {
        this.cancelled = true;
    }
}

it("test that verification should fail in case of publish that does nothing", async () => {
    await expect(required_createPublisher1MustProduceAStreamOfExactly1Element(new NonePublisher())).rejects.toThrowError();
})

it("test that verification should complete successfully in case of correct publisher", async () => {
    await expect(required_createPublisher1MustProduceAStreamOfExactly1Element<number>(new RangePublisher(0, 1))).resolves.toBeUndefined();
})

it("test that verification should fail in case of publisher with incorrect subscription", async () => {
    await expect(required_createPublisher1MustProduceAStreamOfExactly1Element<number>(new RangePublisherWithIncorrectSubscription(0, 1))).rejects.toThrowError("Expected subscription but got [object Object] with missing fields [request,cancel]");
})

it("test that verification should fail in case of publisher with double subscription", async () => {
    await expect(required_createPublisher1MustProduceAStreamOfExactly1Element<number>(new RangePublisherWithDoubleSubscription(0, 1))).rejects.toThrowError("Expected next element but got error [Error: Unexpected Subscriber::onSubscribe[object Object]]");
})
