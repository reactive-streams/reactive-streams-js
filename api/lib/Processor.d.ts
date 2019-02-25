import Subscriber from "./Subscriber";
import Publisher from "./Publisher";
export default interface Processor<T, R> extends Subscriber<T>, Publisher<R> {
}
