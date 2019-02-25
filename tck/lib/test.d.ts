import { Publisher } from 'reactive-streams';
export declare function publisherVerification<T>(fn: (elements: number) => Publisher<T>): void;
