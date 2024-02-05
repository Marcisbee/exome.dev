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
  const {
    filteredTodos,
    addTodo,
    filter,
    setFilter,
  } = useStore(todoListStore)

  return (
    <div className="live-tutorial-todo">
      <div className="live-tutorial-todo-tabs">
        <button
          type="button"
          onClick={() => setFilter("all")}
          disabled={filter === "all"}
        >
          all
        </button>
        <button
          type="button"
          onClick={() => setFilter("todo")}
          disabled={filter === "todo"}
        >
          todo
        </button>
        <button
          type="button"
          onClick={() => setFilter("done")}
          disabled={filter === "done"}
        >
          done
        </button>
      </div>

      <ul>
        {filteredTodos.map((todo) => (
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
