import { Observable } from '../Observable'

/**
 *  A simple Observable that emits no items to the Observer and immediately
 */
export const EMPTY = new Observable<never>((subscriber) => subscriber.complete())
