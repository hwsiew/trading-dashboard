export class LinkedNode<T> {
  previous: LinkedNode<T> | undefined;
  data: T;
  next: LinkedNode<T> | undefined;
  
  constructor(
    data: T, 
    previous?: LinkedNode<T>,
    next?: LinkedNode<T>
  ){
    this.data = data;
    this.previous = previous;
    this.next = next;
  }
}