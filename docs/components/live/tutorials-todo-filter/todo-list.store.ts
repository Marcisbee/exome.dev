import { Exome, onAction, update } from "exome";
import { TodoStore } from "./todo.store";

export class TodoListStore extends Exome {
  public todos: TodoStore[] = [];
  public filter: "all" | "todo" | "done" = "all";

  public get filteredTodos() {
    if (this.filter === "done") {
      return this.todos.filter((t) => t.completed);
    }
    if (this.filter === "todo") {
      return this.todos.filter((t) => !t.completed);
    }
    return this.todos;
  }

  constructor() {
    super();

    onAction(TodoStore, "toggle", () => {
      update(this);
    });
  }

  public addTodo(todo: TodoStore) {
    this.todos.push(todo);
  }

  public setFilter(filter: TodoListStore["filter"]) {
    this.filter = filter;
  }
}
