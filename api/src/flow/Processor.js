// @flow

import type { Subscriber } from "./Subscriber";
import type { Publisher } from "./Publisher";

export interface Processor<T, R> extends Subscriber<T>, Publisher<R> {
}