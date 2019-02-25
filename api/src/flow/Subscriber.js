// @flow

import type { Subscription } from "./Subscription";

export interface Subscriber<T> {
    onSubscribe(s: Subscription): void;
    onNext(t: T): void;
    onError(t: Error): void;
    onComplete(): void;
}