export default interface Subscription {
    request(n: number): void;
    cancel(): void;
}
