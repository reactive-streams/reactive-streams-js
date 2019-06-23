import { Subscriber, Subscription } from 'reactive-streams';
import * as bigInt from 'big-integer';

interface Sink<T> {
  (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void): void;
  resolve(value?: T | PromiseLike<T>): void
  reject(reason?: any): void
}

namespace Sink {
  export const create = <T>() => {
    const sink = <Sink<T>>function (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void): void {
      sink.resolve = resolve
      sink.reject = reject;
    }

    return sink;
  }
}


function timeoutPromise<T>(errorMessage: string, timeout: number) {
  return new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Timeout"));
    }, timeout);
  })
}

export class TestSubscriber<T> implements Subscriber<T> {
  protected subscription!: Promise<Subscription>;
  protected sink: Sink<Subscription>;

  constructor() {
    this.sink = Sink.create();
    this.subscription = new Promise(this.sink);
  }
  onSubscribe(subscription: Subscription): void {
    console.error(`Unexpected Subscriber::onSubscribe${subscription}`);
    fail();
  }
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
  cancel() {
    if (this.subscription) {
      this.subscription.then(s => s.cancel(), e => fail(e));
    }
    else {
      console.error("Cannot cancel a subscription before having received it");
      fail();
    }
  }
}



export class ManualSubscriber<T> extends TestSubscriber<T> {

  private readonly received: Receptacle<T>;
  private requested: bigInt.BigInteger;

  constructor() {
    super();
    this.received = new Receptacle<T>();
    this.requested = bigInt();
  }

  onNext(element: T): void {
    this.received.next(element);
  }

  onComplete(): void {
    this.received.terminate();
  }

  async request(elements: number): Promise<void> {
    const s = await this.subscription;
    s.request(elements);
  }

  async requestNextElement(): Promise<T>
  async requestNextElement(): Promise<T> {
    await this.request(1);
    return this.received.expectNext("");
  }

  // public Optional<T> requestNextElementOrEndOfStream() throws InterruptedException {
  //   return requestNextElementOrEndOfStream(env.defaultTimeoutMillis(), "Did not receive expected stream completion");
  // }

  // public Optional<T> requestNextElementOrEndOfStream(String errorMsg) throws InterruptedException {
  //   return requestNextElementOrEndOfStream(env.defaultTimeoutMillis(), errorMsg);
  // }

  // public Optional<T> requestNextElementOrEndOfStream(long timeoutMillis) throws InterruptedException {
  //   return requestNextElementOrEndOfStream(timeoutMillis, "Did not receive expected stream completion");
  // }

  // public Optional<T> requestNextElementOrEndOfStream(long timeoutMillis, String errorMsg) throws InterruptedException {
  //   request(1);
  //   return nextElementOrEndOfStream(timeoutMillis, errorMsg);
  // }

  // public void requestEndOfStream() throws InterruptedException {
  //   requestEndOfStream(env.defaultTimeoutMillis(), "Did not receive expected stream completion");
  // }

  // public void requestEndOfStream(long timeoutMillis) throws InterruptedException {
  //   requestEndOfStream(timeoutMillis, "Did not receive expected stream completion");
  // }

  // public void requestEndOfStream(String errorMsg) throws InterruptedException {
  //   requestEndOfStream(env.defaultTimeoutMillis(), errorMsg);
  // }

  // public void requestEndOfStream(long timeoutMillis, String errorMsg) throws InterruptedException {
  //   request(1);
  //   expectCompletion(timeoutMillis, errorMsg);
  // }

  // public List<T> requestNextElements(long elements) throws InterruptedException {
  //   request(elements);
  //   return nextElements(elements, env.defaultTimeoutMillis());
  // }

  // public List<T> requestNextElements(long elements, long timeoutMillis) throws InterruptedException {
  //   request(elements);
  //   return nextElements(elements, timeoutMillis, String.format("Did not receive %d expected elements", elements));
  // }

  // public List<T> requestNextElements(long elements, long timeoutMillis, String errorMsg) throws InterruptedException {
  //   request(elements);
  //   return nextElements(elements, timeoutMillis, errorMsg);
  // }

  // public T nextElement() throws InterruptedException {
  //   return nextElement(env.defaultTimeoutMillis());
  // }

  // public T nextElement(long timeoutMillis) throws InterruptedException {
  //   return nextElement(timeoutMillis, "Did not receive expected element");
  // }

  // public T nextElement(String errorMsg) throws InterruptedException {
  //   return nextElement(env.defaultTimeoutMillis(), errorMsg);
  // }

  // public T nextElement(long timeoutMillis, String errorMsg) throws InterruptedException {
  //   return received.next(timeoutMillis, errorMsg);
  // }

  // public Optional<T> nextElementOrEndOfStream() throws InterruptedException {
  //   return nextElementOrEndOfStream(env.defaultTimeoutMillis(), "Did not receive expected stream completion");
  // }

  // public Optional<T> nextElementOrEndOfStream(long timeoutMillis) throws InterruptedException {
  //   return nextElementOrEndOfStream(timeoutMillis, "Did not receive expected stream completion");
  // }

  // public Optional<T> nextElementOrEndOfStream(long timeoutMillis, String errorMsg) throws InterruptedException {
  //   return received.nextOrEndOfStream(timeoutMillis, errorMsg);
  // }

  // public List<T> nextElements(long elements) throws InterruptedException {
  //   return nextElements(elements, env.defaultTimeoutMillis(), "Did not receive expected element or completion");
  // }

  // public List<T> nextElements(long elements, String errorMsg) throws InterruptedException {
  //   return nextElements(elements, env.defaultTimeoutMillis(), errorMsg);
  // }

  // public List<T> nextElements(long elements, long timeoutMillis) throws InterruptedException {
  //   return nextElements(elements, timeoutMillis, "Did not receive expected element or completion");
  // }

  // public List<T> nextElements(long elements, long timeoutMillis, String errorMsg) throws InterruptedException {
  //   return received.nextN(elements, timeoutMillis, errorMsg);
  // }

  // public void expectNext(T expected) throws InterruptedException {
  //   expectNext(expected, env.defaultTimeoutMillis());
  // }

  // public void expectNext(T expected, long timeoutMillis) throws InterruptedException {
  //   T received = nextElement(timeoutMillis, "Did not receive expected element on downstream");
  //   if (!received.equals(expected)) {
  //     env.flop(String.format("Expected element %s on downstream but received %s", expected, received));
  //   }
  // }

  // public void expectCompletion() throws InterruptedException {
  //   expectCompletion(env.defaultTimeoutMillis(), "Did not receive expected stream completion");
  // }

  // public void expectCompletion(long timeoutMillis) throws InterruptedException {
  //   expectCompletion(timeoutMillis, "Did not receive expected stream completion");
  // }

  // public void expectCompletion(String errorMsg) throws InterruptedException {
  //   expectCompletion(env.defaultTimeoutMillis(), errorMsg);
  // }

  // public void expectCompletion(long timeoutMillis, String errorMsg) throws InterruptedException {
  //   received.expectCompletion(timeoutMillis, errorMsg);
  // }

  // public <E extends Throwable> void expectErrorWithMessage(Class<E> expected, String requiredMessagePart) throws Exception {
  //   expectErrorWithMessage(expected, Collections.singletonList(requiredMessagePart), env.defaultTimeoutMillis(), env.defaultPollTimeoutMillis());
  // }
  // public <E extends Throwable> void expectErrorWithMessage(Class<E> expected, List<String> requiredMessagePartAlternatives) throws Exception {
  //   expectErrorWithMessage(expected, requiredMessagePartAlternatives, env.defaultTimeoutMillis(), env.defaultPollTimeoutMillis());
  // }

  // @SuppressWarnings("ThrowableResultOfMethodCallIgnored")
  // public <E extends Throwable> void expectErrorWithMessage(Class<E> expected, String requiredMessagePart, long timeoutMillis) throws Exception {
  //   expectErrorWithMessage(expected, Collections.singletonList(requiredMessagePart), timeoutMillis);
  // }

  // public <E extends Throwable> void expectErrorWithMessage(Class<E> expected, List<String> requiredMessagePartAlternatives, long timeoutMillis) throws Exception {
  //   expectErrorWithMessage(expected, requiredMessagePartAlternatives, timeoutMillis, timeoutMillis);
  // }

  // public <E extends Throwable> void expectErrorWithMessage(Class<E> expected, List<String> requiredMessagePartAlternatives,
  //                                                          long totalTimeoutMillis, long pollTimeoutMillis) throws Exception {
  //   final E err = expectError(expected, totalTimeoutMillis, pollTimeoutMillis);
  //   final String message = err.getMessage();

  //   boolean contains = false;
  //   for (String requiredMessagePart : requiredMessagePartAlternatives)
  //     if (message.contains(requiredMessagePart)) contains = true; // not short-circuting loop, it is expected to
  //   assertTrue(contains,
  //           String.format("Got expected exception [%s] but missing message part [%s], was: %s",
  //                   err.getClass(), "anyOf: " + requiredMessagePartAlternatives, err.getMessage()));
  // }

  // public <E extends Throwable> E expectError(Class<E> expected) throws Exception {
  //   return expectError(expected, env.defaultTimeoutMillis());
  // }

  // public <E extends Throwable> E expectError(Class<E> expected, long timeoutMillis) throws Exception {
  //   return expectError(expected, timeoutMillis, env.defaultPollTimeoutMillis());
  // }

  // public <E extends Throwable> E expectError(Class<E> expected, String errorMsg) throws Exception {
  //   return expectError(expected, env.defaultTimeoutMillis(), errorMsg);
  // }

  // public <E extends Throwable> E expectError(Class<E> expected, long timeoutMillis, String errorMsg) throws Exception {
  //   return expectError(expected, timeoutMillis, env.defaultPollTimeoutMillis(), errorMsg);
  // }

  // public <E extends Throwable> E expectError(Class<E> expected, long totalTimeoutMillis, long pollTimeoutMillis) throws Exception {
  //   return expectError(expected, totalTimeoutMillis, pollTimeoutMillis, String.format("Expected onError(%s)", expected.getName()));
  // }

  // public <E extends Throwable> E expectError(Class<E> expected, long totalTimeoutMillis, long pollTimeoutMillis,
  //                                            String errorMsg) throws Exception {
  //   return received.expectError(expected, totalTimeoutMillis, pollTimeoutMillis, errorMsg);
  // }

  // public void expectNone() throws InterruptedException {
  //   expectNone(env.defaultNoSignalsTimeoutMillis());
  // }

  // public void expectNone(String errMsgPrefix) throws InterruptedException {
  //   expectNone(env.defaultNoSignalsTimeoutMillis(), errMsgPrefix);
  // }

  // public void expectNone(long withinMillis) throws InterruptedException {
  //   expectNone(withinMillis, "Did not expect an element but got element");
  // }

  // public void expectNone(long withinMillis, String errMsgPrefix) throws InterruptedException {
  //   received.expectNone(withinMillis, errMsgPrefix);
  // }

}

export class Receptacle<T> {
  private sink: Sink<T | Array<T> | Error>;
  private task: Promise<T | Array<T> | Error | void>;
  private actions: T[] = [];
  private expects: number = 0;
  private done: boolean = false;
  private error?: Error;

  constructor() {
    this.sink = Sink.create();
    this.task = new Promise(this.sink);
  }

  next(element: T) {
    if (this.done) {
      fail("Emitted unexpected next after Terminal signal")
    }
    const actions = this.actions;
    const sink = this.sink;
    if (this.expects < 0) {
      sink.reject(new Error("Received unexpected onNext call [" + element + "]"));
    }
    else if (this.expects === 0) {
      actions.push(element);
    }
    else if (this.expects === 1) {
      this.sink = Sink.create();
      this.task = new Promise(this.sink);
      sink.resolve(element);
    }
    else if (actions.length < this.expects) {
      actions.push(element);
      if (actions.length == this.expects) {
        this.actions = [];
        this.expects = 0;
        this.sink = Sink.create();
        this.task = new Promise(this.sink);
        sink.resolve(actions);
      }
    }
  }

  terminate(): void
  terminate(error: Error): void
  terminate(error?: Error): void {
    if (this.done) {
      fail("Emitted Terminal signal twice")
    }

    this.done = true;
    this.error = error;

    if (this.actions.length === 0 || (this.expects !== 0 && this.actions.length !== this.expects)) {
      this.sink.resolve(this.error);
    }
  }

  async expectNext(errorMessage: string): Promise<T>
  async expectNext(errorMessage: string, timeout: number = 1000): Promise<T> {
    const actions = this.actions;

    if (actions.length >= 1) {
      return Promise.resolve(actions.shift() as T);
    }

    if (this.done) {
      return Promise.reject(
        this.error
          ? new Error("Expected element but got error: " + this.error.message)
          : new Error("Expected element but got completion")
      );
    }

    this.expects = 1;
    const promise = timeoutPromise<T>(errorMessage, timeout);
    return Promise.race([
      this.task.then<T>(e => {
        if (e instanceof Error) {
          return Promise.reject(new Error("Expected next element but got error [" + e + "]"));
        } else if(!e) {
          return Promise.reject(new Error("Expected next element but got completion"));
        } else {
          return e as T; 
        }
      }), 
      promise
    ]);
  }

  async expectNextN(n: number, errorMessage: string): Promise<T[]>
  async expectNextN(n: number, errorMessage: string, timeout: number = 1000): Promise<T[]> {
    const actions = this.actions;

    if (actions.length >= n) {
      return Promise.resolve(actions.splice(0, n));
    }

    if (this.done) {
      return Promise.reject(
        this.error
          ? new Error("Expected " + n + " elements but got error: [" + this.error + "]")
          : new Error("Expected " + n + " elements but got completion")
      );
    }

    this.expects = n;
    const promise = timeoutPromise<T[]>(errorMessage, timeout);
    return Promise.race<T[]>([
      this.task.then<T[]>(e => {
        if (e instanceof Array) {
          return e;
        } else if (e instanceof Error) {
          return Promise.reject(new Error("Expected next " + n + " elements but got error [" + e + "]"));
        } else {
          return Promise.reject(new Error("Expected next " + n + " elements but got completion"));
        }
      }),
      promise
    ]);
  }

  async expectComplete(errorMessage: string): Promise<void>
  async expectComplete(errorMessage: string, timeout: number = 1000): Promise<void> {
    if (this.done) {
      if (this.actions.length == 0) {
        if (this.error) {
          return Promise.reject(new Error("Expected completion but got error [" + this.error + "]"))
        } else {
          return Promise.resolve();
        }
      } else {
        return Promise.reject(new Error("Expected the end of the stream but got elements [" + this.actions + "]"))
      }
    } else if (this.actions.length > 0) {
      return Promise.reject(new Error("Expected the end of the stream but got elements [" + this.actions + "]"))
    }

    this.expects = -1;
    const promise = timeoutPromise<void>(errorMessage, timeout);
    return Promise.race<void>([
      this.task.then<void>(e => {
        if (e instanceof Error) {
          return Promise.reject<void>(new Error("Expected completion but got error [" + e + "]"));
        } else {
          return Promise.resolve();
        }
      }), 
      promise
    ]);
  }

  async expectError<TView extends Error>(errorType: { new (...args: any[]): TView }, errorMessage:string): Promise<Error>
  async expectError<TView extends Error>(errorType: { new (...args: any[]): TView }, errorMessage:string, timeout: number = 1000): Promise<Error> { 
    if (this.done) {
      if (this.actions.length == 0) {
        if (!this.error) {
          return Promise.reject(new Error("Expected error but got completion"))
        } else {
          return Promise.resolve(this.error);
        }
      } else {
        return Promise.reject(new Error("Expected the end of the stream but got elements [" + this.actions + "]"))
      }
    } else if (this.actions.length > 0) {
      return Promise.reject(new Error("Expected the end of the stream but got elements [" + this.actions + "]"))
    }

    this.expects = -1;
    const promise = timeoutPromise<Error>(errorMessage, timeout);
    return Promise.race<Error>([
      this.task.then<Error>(e => {
        if (e instanceof Error) {
          if (e instanceof errorType) {
            return e;
          } else {
            return Promise.reject(new Error("Expected error of type [" + errorType + "] but got [" + e + "] instead"));
          }
        } else if (!e) {
          return Promise.reject(new Error("Expected error but got completion"))
        } else {
          return Promise.reject(new Error("Expected terminal signal but got next [" + e + "] instead"))
        }
      }),
      promise
    ])
  }
  async expectNextOrEndOfStream(errorMessage: string): Promise<T | Error | void>
  async expectNextOrEndOfStream(errorMessage: string, timeout: number = 1000): Promise<T | Error | void> {
    if (this.actions.length >= 1) {
      return Promise.resolve(this.actions.shift() as T);
    }
    if (this.done) {
      return Promise.resolve(this.error);
    }

    this.expects = 1;
    const promise = timeoutPromise<T | Error | void>(errorMessage, timeout);
    return Promise.race([(this.task as any), promise])
  }

  async expectNone(errorMessage: string): Promise<T | Error | void>
  async expectNone(errorMessage: string, timeout: number = 1000): Promise<T | Error | void> {
    if (this.actions.length >= 1) {
      return Promise.resolve(this.actions.shift() as T);
    }
    
    if (this.done && this.expects !== -1) {
      return this.error 
        ? Promise.reject(new Error("Expected none but got error [" + this.error + "]"))
        : Promise.reject(new Error("Expected none but got completion"));
    }

    this.expects = -1;
    const promise = timeoutPromise<T | Error | void>(errorMessage, timeout);
    return Promise.race([
      this.task.then(e => {
        if (e instanceof Error) {
          return Promise.reject(new Error("Expected none but got error [" + e + "]"));
        } else if (e) {
          return Promise.reject(new Error("Expected none but got next [" + e + "]"));
        } else {
          return Promise.reject(new Error("Expected none but got completion"));
        }
      }),
      promise.catch(() => Promise.resolve())
    ])
  }
}