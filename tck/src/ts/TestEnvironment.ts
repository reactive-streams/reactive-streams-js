import { Subscriber, Subscription } from 'reactive-streams';
import * as bigInt from 'big-integer';

interface Sink<T> {
  (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void): void;
  resolve(value?: T | PromiseLike<T>): void
  reject(reason?: any): void

  isFulfilled(): boolean;
}

interface CancelablePromise<T> extends Promise<T> {
  cancel(): void;
}

namespace Sink {
  export const create = <T>() => {
    const sink = <Sink<T>>function (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void): void {
      let isFulfilled = false;
      sink.resolve = (value?: T | PromiseLike<T>) => {
        isFulfilled = true;
        resolve(value)
      };
      sink.reject = (reason?: any) => {
        isFulfilled = true;
        reject(reason);
      };
      sink.isFulfilled = () => isFulfilled;
    }

    return sink;
  }
}

const neverResolvePromise = new Promise((__, ____) => { });

const cancelablePromiseFactory = () => {
  let isCanceled = false;
  return class CancelablePromiseImpl<T> extends Promise<T> implements CancelablePromise<T> {
    private _cancel?: () => void;

    constructor(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void, cancel?: () => void) {
      super((resolve, reject) => {
        executor(
          (value?: T | PromiseLike<T>) => {
            if (isCanceled) {
              return;
            }

            if (value instanceof Promise) {
              resolve(value.then(
                e => {
                  if (isCanceled) {
                    return neverResolvePromise;
                  }

                  return e;
                },
                r => {
                  if (isCanceled) {
                    return neverResolvePromise;
                  }

                  return Promise.reject(r)
                }
              ));
            } else {
              resolve(value);
            }
          },
          (reason?: any) => {
            if (isCanceled) {
              return;
            }

            reject(reason);
          }
        );
      });
      this._cancel = cancel;
    }

    public cancel() {
      isCanceled = true;
      this._cancel?.();
    }
  }
}

export class AsyncQueue<T> {
  private readonly store: T[] = [];
  private promise?: CancelablePromise<T>;
  private sink?: Sink<T>;

  isEmpty(): boolean {
    return this.store.length > 0;
  }

  poll(): CancelablePromise<T> {
    if (this.store.length > 0) {
      return new (cancelablePromiseFactory())(r => r(this.store.shift() as T));
    }

    return this.createPromise();
  }

  push(value: T | undefined): void {
    const promise = this.promise;
    const sink = this.sink;

    this.sink = undefined;
    this.promise = undefined;

    if (promise) {
      sink!.resolve(value);
      return;
    }

    this.store.push(value as T);
  }

  private createPromise() {
    if (this.promise) {
      throw new Error("Only as single promise allowed");
    }

    this.sink = Sink.create();
    this.promise = new (cancelablePromiseFactory())(
      this.sink,
      () => {
        this.sink = undefined;
        this.promise = undefined;
      }
    );

    return this.promise;
  }
}


function timeoutPromise<T>(errorMessage: string, timeout: number) {
  return new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage + " within " + timeout + " ms but timed out"));
    }, timeout);
  })
}


interface Event<T> {
  readonly value?: T;
}

class CompletionEvent implements Event<void> {
  constructor() {
  }
}

class ErrorEvent implements Event<Error> {
  constructor(private readonly error: Error) {
  }

  get value(): Error {
    return this.error;
  }
}

class ValueEvent<T> implements Event<T> {
  constructor(private readonly element: T) {
  }

  get value(): T {
    return this.element;
  }
}


export class Receptacle<T> extends AsyncQueue<CompletionEvent | ErrorEvent | ValueEvent<T>> {
  private done: boolean = false;

  constructor() {
    super();
  }

  next(element: T) {
    if (this.done) {
      this.push(new ErrorEvent(new Error(`Emitted unexpected next [${element}] after Terminal signal`)));
      return;
    }

    this.push(new ValueEvent(element));
  }

  error(error: Error) {
    if (this.done) {
      this.push(new ErrorEvent(new Error(`Emitted unexpected error [${error}] after Terminal signal`)));
      return;
    }

    this.push(new ErrorEvent(error));
  }

  terminate(): void {
    if (this.done) {
      this.push(new ErrorEvent(new Error("Emitted termination more than once")));
      return;
    }

    this.done = true;

    this.push(new CompletionEvent());
  }

  async expectNext(): Promise<T>
  async expectNext(errorMessage: string): Promise<T>
  async expectNext(errorMessage: string, timeout: number): Promise<T>
  async expectNext(errorMessage: string = "Expected next element", timeout: number = 1000): Promise<T> {
    return Promise.race([
      this.poll().then(async t => {
        if (t instanceof CompletionEvent) {
          return this.undesiredCompletion<T>(errorMessage);
        } else if (t instanceof ErrorEvent) {
          return this.undesiredError<T>(errorMessage, t.value);
        }

        return t.value;
      }),
      timeoutPromise<T>(errorMessage, timeout)
    ]);
  }

  async expectNextN(n: number): Promise<T[]>
  async expectNextN(n: number, errorMessage: string): Promise<T[]>
  async expectNextN(n: number, errorMessage: string, timeout: number): Promise<T[]>
  async expectNextN(n: number, errorMessage: string = `Expected next ${n} elements`, timeout: number = 1000): Promise<T[]> {
    return Promise.race<T[]>([
      this.expectNext(errorMessage).then(async t => {
        const toCarrieOut: T[] = [];

        toCarrieOut.push(t);

        for (let i = 0; i < (n - 1); i++) {
          const next = await this.expectNext(errorMessage);

          toCarrieOut.push(next);
        }

        return toCarrieOut;
      }),
      timeoutPromise<T[]>(errorMessage, timeout)
    ]);
  }

  async expectComplete(): Promise<void>
  async expectComplete(errorMessage: string): Promise<void>
  async expectComplete(errorMessage: string, timeout: number): Promise<void>
  async expectComplete(errorMessage: string = `Expected completion`, timeout: number = 1000): Promise<void> {
    return Promise.race<void>([
      this.poll().then(async t => {
        if (t instanceof CompletionEvent) {
          return Promise.resolve();
        } else if (t instanceof ErrorEvent) {
          return this.undesiredError<void>(errorMessage, t.value);
        }

        return this.undesiredNext<void>(errorMessage, t.value);
      }),
      timeoutPromise<void>(errorMessage, timeout)
    ]);
  }

  async expectError<E extends Error>(errorType: { new(...args: any[]): E }): Promise<E>
  async expectError<E extends Error>(errorType: { new(...args: any[]): E }, errorMessage: string): Promise<E>
  async expectError<E extends Error>(errorType: { new(...args: any[]): E }, errorMessage: string, timeout: number): Promise<E>
  async expectError<E extends Error>(errorType: { new(...args: any[]): E }, errorMessage: string = `Expected error of type [${errorType}]`, timeout: number = 1000): Promise<E> {
    return Promise.race<E>([
      this.poll().then(async t => {
        if (t instanceof CompletionEvent) {
          return this.undesiredCompletion<E>(errorMessage);
        } else if (t instanceof ErrorEvent) {
          if (t.value instanceof errorType) {
            return t.value;
          }
  
          return this.undesiredError<E>(errorMessage, t.value);
        }

        return this.undesiredNext<E>(errorMessage, t.value);
      }),
      timeoutPromise<E>(errorMessage, timeout)
    ])
  }

  async expectNextOrComplete(): Promise<T | void>
  async expectNextOrComplete(errorMessage: string): Promise<T | void>
  async expectNextOrComplete(errorMessage: string, timeout: number): Promise<T | void>
  async expectNextOrComplete(errorMessage: string = `Expected next or completion`, timeout: number = 1000): Promise<T | void> {
    return Promise.race([
      this.poll().then(async t => {
        if (t instanceof CompletionEvent) {
          return Promise.resolve();
        } else if (t instanceof ErrorEvent) {
          return this.undesiredError<void>(errorMessage, t.value);
        }

        return t.value;
      }),
      timeoutPromise<T | void>(errorMessage, timeout)
    ])
  }

  async expectNone(): Promise<void>
  async expectNone(errorMessage: string): Promise<void>
  async expectNone(errorMessage: string, timeout: number): Promise<void>
  async expectNone(errorMessage: string = "Expected none", timeout: number = 1000): Promise<void> {
    const valuePromise = this.poll();
    return Promise.race([
      valuePromise.then(t => {
        if (t instanceof CompletionEvent) {
          return this.undesiredCompletion<void>(errorMessage);
        } else if (t instanceof ErrorEvent) {
          return this.undesiredError<void>(errorMessage, t.value);
        }

        return this.undesiredNext<void>(errorMessage, t.value);
      }),
      timeoutPromise<void>(errorMessage, timeout).then(_ => { }, _ => {
        valuePromise.cancel();

        return Promise.resolve();
      })
    ])
  }

  private async undesiredNext<LT>(errorMessage: string, t: T): Promise<LT> {
    return Promise.reject(new Error(`${errorMessage} but got next [${t}]`));
  }

  private async undesiredError<LT>(errorMessage: string, e: Error): Promise<LT> {
    return Promise.reject(new Error(`${errorMessage} but got error [${e}]`));
  }

  private async undesiredCompletion<LT>(errorMessage: string): Promise<LT> {
    return Promise.reject(new Error(`${errorMessage} but got completion`));
  }
}


export class TestSubscriber<T> implements Subscriber<T> {
  private readonly subscription: Promise<Subscription>;
  private readonly sink: Sink<Subscription>;
  protected readonly received: Receptacle<T>;

  constructor() {
    this.received = new Receptacle<T>();
    this.sink = Sink.create();
    this.subscription = new Promise(this.sink);
  }

  onSubscribe(subscription: Subscription): void {
    if (this.sink.isFulfilled()) {
      this.received.error(new Error(`Unexpected Subscriber::onSubscribe${subscription}`));
    }

    this.sink.resolve(subscription);
  }

  onError(cause: Error): void {
    this.received.error(new Error(`Unexpected Subscriber::onError(${cause})`));
  }

  onComplete(): void {
    this.received.error(new Error("Unexpected Subscriber::onComplete()"));
  }

  onNext(element: T): void {
    this.received.error(new Error(`Unexpected Subscriber::onNext(${element})`));
  }

  cancel() {
    this.expectSubscription().then(s => s.cancel(), e => this.received.error(new Error(`Expected Subscription but got [${e}]`)));
  }

  async expectSubscription(): Promise<Subscription>;
  async expectSubscription(timeout: number): Promise<Subscription>;
  async expectSubscription(timeout: number, errorMsg: string): Promise<Subscription>;
  async expectSubscription(timeout: number = 1000, errorMsg: string = "Expected subscription"): Promise<Subscription> {
    return Promise.race([
      timeoutPromise<Subscription>(errorMsg, timeout),
      this.subscription.then(s => {
        if (s) {
          let missing: string[] = [];

          if (!s.request) {
            missing.push("request");
          }
          if (!s.cancel) {
            missing.push("cancel");
          }

          if (missing.length != 0) {
            return Promise.reject<Subscription>(new Error(`Expected subscription but got ${s} with missing fields [${missing}]`));
          }

          return s;
        }

        return Promise.reject<Subscription>(new Error(`Expected subscription but got nothing`));
      })
    ]);
  }
}

export class ManualSubscriber<T> extends TestSubscriber<T> {

  private requested: bigInt.BigInteger;

  constructor() {
    super();
    this.requested = bigInt();
  }

  onNext(element: T): void {
    if (this.requested.eq(0)) {
      fail("Received more than onNext signals than expected!");
    }

    this.requested = this.requested.prev();

    this.received.next(element);
  }

  onComplete(): void {
    this.received.terminate();
  }

  async request(elements: number): Promise<void> {
    const s: Subscription = await this.expectSubscription();
    this.requested = this.requested.add(elements);
    s.request(elements);
  }

  async requestNextElement(): Promise<T>;
  async requestNextElement(timeout: number): Promise<T>;
  async requestNextElement(timeout: number, errorMessage: string): Promise<T>;
  async requestNextElement(timeout: number = 1000, errorMessage: string = "Expected next element"): Promise<T> {
    await this.request(1);
    return this.nextElement(timeout, errorMessage);
  }

  async requestNextElementOrCompletion(): Promise<T | void>;
  async requestNextElementOrCompletion(timeout: number): Promise<T | void>;
  async requestNextElementOrCompletion(timeout: number, errorMsg: string): Promise<T | void>;
  async requestNextElementOrCompletion(timeout: number = 1000, errorMsg: string = "Expected next element or completion"): Promise<T | void> {
    await this.request(1);
    return this.nextElementOrCompletion(timeout, errorMsg);
  }

  async requestCompletion(): Promise<void>;
  async requestCompletion(timeout: number): Promise<void>;
  async requestCompletion(timeout: number, errorMsg: string): Promise<void>;
  async requestCompletion(timeout: number = 1000, errorMsg: string = "Expected completion"): Promise<void> {
    await this.request(1);
    return this.expectCompletion(timeout, errorMsg);
  }

  async requestNextElements(elements: number): Promise<T[]>;
  async requestNextElements(elements: number, timeout: number): Promise<T[]>;
  async requestNextElements(elements: number, timeout: number, errorMsg: string): Promise<T[]>;
  async requestNextElements(elements: number, timeout: number = 1000, errorMsg: string = `Expected next [${elements}] element`): Promise<T[]> {
    await this.request(elements);
    return this.nextElements(elements, timeout, errorMsg);
  }

  async nextElement(): Promise<T>;
  async nextElement(timeout: number): Promise<T>;
  async nextElement(timeout: number, errorMsg: string): Promise<T>;
  async nextElement(timeout: number = 1000, errorMsg: string = "Expected next element"): Promise<T> {
    return this.received.expectNext(errorMsg, timeout);
  }

  async nextElementOrCompletion(): Promise<T | void>;
  async nextElementOrCompletion(timeout: number): Promise<T | void>;
  async nextElementOrCompletion(timeout: number, errorMsg: string): Promise<T | void>;
  async nextElementOrCompletion(timeout: number = 1000, errorMsg: string = "Expected next element or completion"): Promise<T | void> {
    return this.received.expectNextOrComplete(errorMsg, timeout);
  }

  async nextElements(elements: number): Promise<T[]>;
  async nextElements(elements: number, timeout: number): Promise<T[]>;
  async nextElements(elements: number, timeout: number, errorMsg: string): Promise<T[]>;
  async nextElements(elements: number, timeout: number = 1000, errorMsg: string = `Expected next [${elements}] element`): Promise<T[]> {
    return this.received.expectNextN(elements, errorMsg, timeout);
  }

  async expectNext(expected: T): Promise<void>;
  async expectNext(expected: T, timeout: number): Promise<void>;
  async expectNext(expected: T, timeout: number = 1000): Promise<void> {
    const received: T = await this.nextElement(timeout, "Expected next element");
    if (received !== expected) {
      return Promise.reject(new Error(`Expected element [${expected}] on downstream but received [${received}]`));
    }
  }

  async expectCompletion(): Promise<void>;
  async expectCompletion(timeout: number): Promise<void>;
  async expectCompletion(timeout: number, errorMsg: string): Promise<void>;
  async expectCompletion(timeout: number = 1000, errorMsg: string = "Did not receive expected stream completion"): Promise<void> {
    this.received.expectComplete(errorMsg, timeout);
  }

  async expectErrorWithMessage<E extends Error>(expected: (new () => E), requiredMessagePart: string): Promise<void>
  async expectErrorWithMessage<E extends Error>(expected: (new () => E), requiredMessagePartAlternatives: string[]): Promise<void>;
  async expectErrorWithMessage<E extends Error>(expected: (new () => E), requiredMessagePartAlternatives: string[], timeout: number): Promise<void>;
  async expectErrorWithMessage<E extends Error>(expected: (new () => E), requiredMessagePartAlternatives: string[] | string, timeout: number = 1000): Promise<void> {
    const err: E = await this.expectError(expected, timeout);
    const message = err.message;

    const partsToCheck: string[] = requiredMessagePartAlternatives instanceof Array
      ? requiredMessagePartAlternatives
      : [requiredMessagePartAlternatives];

    if (!partsToCheck.some((requiredMessagePart) => message.includes(requiredMessagePart))) {
      return Promise.reject(new Error("Got expected exception [" + expected.name + "] but missing any of [" + requiredMessagePartAlternatives + "] message parts, was: " + message));
    }
  }

  async expectError<E extends Error>(expected: (new () => E)): Promise<E>;
  async expectError<E extends Error>(expected: (new () => E), timeout: number): Promise<E>;
  async expectError<E extends Error>(expected: (new () => E), timeout: number, errorMsg: string): Promise<E>;
  async expectError<E extends Error>(expected: (new () => E), timeout: number = 1000, errorMsg: string = "Expected onError(" + expected.name + ")"): Promise<E> {
    return this.received.expectError(expected, errorMsg, timeout);
  }

  async expectNone(): Promise<void>;
  async expectNone(timeout: number): Promise<void>;
  async expectNone(timeout: number, errMsgPrefix: string): Promise<void>;
  async expectNone(timeout: number = 1000, errMsgPrefix: string = "Did not expect an element but got element"): Promise<void> {
    return this.received.expectNone(errMsgPrefix, timeout);
  }
}