import Subscriber from "./Subscriber";

export default interface Publisher<T> {
    subscribe<S extends T>(s: Subscriber<S>): void;
}