import { isSubscriber, Subscriber } from './Subscriber'
import { Subscription } from './Subscription'
import { Observer, Operator, OperatorFunction, Subscribable, TeardownLogic } from './types'
import { pipeFromArray } from './utils/pipe'

export class Observable<T> implements Subscribable<T> {
  /**
   * @deprecated use by internal
   */
  source: Observable<any> | undefined
  /**
   *
   * @deprecated use by internal
   * @memberof Observable
   */
  operator: Operator<any, T> | undefined

  constructor(subscribe?: (this: Observable<T>, subscriber: Subscriber<T>) => TeardownLogic) {
    if (subscribe) {
      this._subscribe = subscribe
    }
  }

  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null): Subscription {
    const subscriber = isSubscriber(observerOrNext) ? observerOrNext : new Subscriber(observerOrNext)
    const { operator, source } = this
    
    // 将 operator 返回值 add 到当前 subscriber 的 teardown 中
    subscriber.add(operator ? operator.call(subscriber, source) : this._trySubscribe(subscriber))
    return subscriber
  }

  /**
   * Creates a new Observable, with this Observable instance as the source, and the passed operator defined as the new observable's operator.
   * @param operator
   * @deprecated use by internal
   * @returns a new Observable with the Operator applied
   */
  lift<R>(operator?: Operator<T, R>): Observable<R> {
    const observable = new Observable<R>()
    observable.source = this
    observable.operator = operator
    return observable
  }

  pipe(): Observable<T>
  pipe<A>(op1: OperatorFunction<T, A>): Observable<A>
  pipe<A, B>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>): Observable<B>
  pipe<A, B, C>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>): Observable<C>
  pipe<A, B, C, D>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
  ): Observable<D>
  pipe<A, B, C, D, E>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
  ): Observable<E>
  pipe<A, B, C, D, E, F>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
  ): Observable<F>
  pipe<A, B, C, D, E, F, G>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
  ): Observable<G>
  pipe<A, B, C, D, E, F, G, H>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>,
  ): Observable<H>
  pipe<A, B, C, D, E, F, G, H, I>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>,
    op9: OperatorFunction<H, I>,
  ): Observable<I>
  pipe<A, B, C, D, E, F, G, H, I>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>,
    op9: OperatorFunction<H, I>,
    ...operations: OperatorFunction<any, any>[]
  ): Observable<unknown>

  pipe(...operations: OperatorFunction<any, any>[]): Observable<any> {
    return pipeFromArray(operations)(this)
  }

  /**
   * @internal
   * will be rewrite by subject
   *  */
  protected _subscribe(_subscriber: Subscriber<any>): TeardownLogic {}

  /** @internal */
  protected _trySubscribe(sink: Subscriber<T>): TeardownLogic {
    try {
      return this._subscribe(sink)
    } catch (err) {
      sink.error(err)
    }
  }
}
