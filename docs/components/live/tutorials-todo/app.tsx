import { getExomeId } from "exome";
import { useStore } from "exome/react";
import { TodoListStore } from "./todo-list.store";
import { TodoStore } from "./todo.store";

const todoListStore = new TodoListStore();

// Fill store with some demo values
todoListStore.addTodo(new TodoStore("Take out trash"));
todoListStore.addTodo(new TodoStore("Work out"));

function Todo({ todo }: { todo: TodoStore }) {
  const { completed, content, toggle } = useStore(todo);

  return (
    <label>
      <input type="checkbox" onChange={toggle} checked={completed} />{" "}
      <span>{content}</span>
    </label>
  );
}

export function TodoList() {
  const { todos, addTodo } = useStore(todoListStore);

  return (
    <div className="live-tutorial-todo">
      <ul>
        {todos.map((todo) => (
          <li key={getExomeId(todo)}>
            <Todo todo={todo} />
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const { content: contentEl } = e.target.elements;
          addTodo(new TodoStore(contentEl.value));
          contentEl.value = "";
        }}
      >
        <input name="content" />
        <button type="submit">add</button>
      </form>
    </div>
  );
}
