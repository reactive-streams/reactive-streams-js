/************************************************************************
 * Licensed under Public Domain (CC0)                                    *
 *                                                                       *
 * To the extent possible under law, the person who associated CC0 with  *
 * this code has waived all copyright and related or neighboring         *
 * rights to this code.                                                  *
 *                                                                       *
 * You should have received a copy of the CC0 legalcode along with this  *
 * work. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.*
 ************************************************************************/

declare namespace reactivestreams {
  /**
   * A Subscription represents a one-to-one lifecycle of a Subscriber subscribing to a Publisher.
   *
   * It can only be used once by a single Subscriber.
   *
   * It is used to both signal desire for data and cancel demand (and allow resource cleanup).
   */
  export interface Subscription {
    /**
     * No events will be sent by a Publisher until demand is signaled via this method.
     *
     *  It can be called however often and whenever needed—but if the outstanding cumulative demand ever becomes Number.MAX_SAFE_INTEGER or more,
     *  it may be treated by the Publisher as "effectively unbounded".
     *
     * Whatever has been requested can be sent by the Publisher so only signal demand for what can be safely handled.
     *
     * A Publisher can send less than is requested if the stream ends but
     * then must emit either Subscriber.onError(Error) or Subscriber.onComplete().
     */
    request(n: number): void;

    /**
     * Request the Publisher to stop sending data and clean up resources.
     *
     * Data may still be sent to meet previously signalled demand after calling cancel.
     */
    cancel(): void;
  }

  /**
   * Will receive call to Subscriber.onSubscribe(Subscription) once after passing an instance of Subscriber to Publisher.subscribe(Subscriber).
   *
   * No further notifications will be received until Subscription.request(number) is called.
   *
   * After signaling demand:
   * - One or more invocations of Subscriber.onNext(T) up to the maximum number defined by Subscription.request(number)
   * - Single invocation of Subscriber.onError(Error) or Subscriber.onComplete() which signals a terminal state after which no further events will be sent.
   *
   * Demand can be signaled via Subscription.request(number) whenever the Subscriber instance is capable of handling more.
   */
  export interface Subscriber<T> {
    /**
     * Invoked after calling Publisher.subscribe(Subscriber).
     *
     * No data will start flowing until Subscription.request(number) is invoked.
     *
     * It is the responsibility of this Subscriber instance to call Subscription.request(number) whenever more data is wanted.
     *
     * The Publisher will send notifications only in response to Subscription.request(number).
     */
    onSubscribe(s: Subscription): void;

    /**
     * Data notification sent by the Publisher in response to requests to Subscription.request(number).
     */
    onNext(t: T): void;

    /**
     * Failed terminal state.
     *
     * No further events will be sent even if Subscription.request(number) is invoked again.
     */
    onError(t: Error): void;

    /**
     * Successful terminal state.
     *
     * No further events will be sent even if Subscription.request(number) is invoked again.
     */
    onComplete(): void;
  }

  /**
   * A Publisher is a provider of a potentially unbounded number of sequenced elements, publishing them according to
   * the demand received from its Subscriber(s).
   *
   * A Publisher can serve multiple Subscribers subscribed Publisher.subscribe(Subscriber) dynamically
   * at various points in time.
   */
  export interface Publisher<T> {
    /**
     * Request Publisher to start streaming data.
     *
     * This is a "factory method" and can be called multiple times, each time starting a new Subscription.
     *
     * Each Subscription will work for only a single Subscriber.
     *
     * A Subscriber should only subscribe once to a single Publisher.
     *
     * If the Publisher rejects the subscription attempt or otherwise fails it will
     * signal the error via Subscriber.onError(Error).
     */
    subscribe(s: Subscriber<T>): void;
  }

  /**
   * A Processor represents a processing stage—which is both a Subscriber
   * and a Publisher and obeys the contracts of both.
   */
  export interface Processor<T, R> extends Subscriber<T>, Publisher<R> {
  }
}

export = reactivestreams;
