import { Exome } from "exome";

export class TodoStore extends Exome {
  public completed = false;

  constructor(public content: string) {
    super();
  }

  public toggle() {
    this.completed = !this.completed;
  }
}
