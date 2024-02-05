import { Exome, getExomeId } from "exome";
import { useStore } from "exome/react";

class TodoStore extends Exome {
	public completed = false;

	constructor(public content: string) {
		super();
	}

	public toggle() {
		this.completed = !this.completed;
	}
}

class TodoListStore extends Exome {
	public todos: TodoStore[] = [];

	public addTodo(todo: TodoStore) {
		this.todos.push(todo);
	}
}

const todoListStore = new TodoListStore();

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

export function LiveTodoReactGuides() {
	const { todos, addTodo } = useStore(todoListStore);

	return (
		<div>
			<ul>
				{todos.map((todo) => (
					<li key={getExomeId(todo)}>
						<Todo todo={todo} />
					</li>
				))}
			</ul>

			{/* <form
				onSubmit={(e) => {
					e.preventDefault();

					const todoEl = e.target.elements.todo;

					addTodo(new TodoStore(todoEl.value))

					todoEl.value = ""
				}}
			>
				<input type="text" name="todo" />
				<button type="submit">add</button>
			</form> */}
		</div>
	);
}
