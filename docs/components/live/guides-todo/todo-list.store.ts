import { Exome } from "exome";
import { TodoStore } from "./todo.store";

export class TodoListStore extends Exome {
  public todos: TodoStore[] = [];

  public addTodo(todo: TodoStore) {
    this.todos.push(todo);
    todo.completed
  }
}
