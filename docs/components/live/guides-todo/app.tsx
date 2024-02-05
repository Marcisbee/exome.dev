import { getExomeId } from "exome";
import { useStore } from "exome/react";
import { TodoListStore } from "./todo-list.store";
import { TodoStore } from "./todo.store";

const todoListStore = new TodoListStore();

// Fill store with some demo values
todoListStore.addTodo(new TodoStore("Throw the trash out"));
todoListStore.addTodo(new TodoStore("Work out"));

function Todo({ todo }: { todo: TodoStore }) {
  const { completed, content, toggle } = useStore(todo);

  return (
    <label>
      <input type="checkbox" onChange={toggle} checked={completed} /> {content}
    </label>
  );
}

export function TodoList() {
  const { todos, addTodo } = useStore(todoListStore);

  return (
    <ul>
      {todos.map((todo) => (
        <li key={getExomeId(todo)}>
          <Todo todo={todo} />
        </li>
      ))}
    </ul>
  );
}
