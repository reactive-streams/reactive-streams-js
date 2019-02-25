import Subscription from "./Subscription";
export default interface Subscriber<T> {
    onSubscribe(s: Subscription): void;
    onNext(t: T): void;
    onError(t: Error): void;
    onComplete(): void;
}
