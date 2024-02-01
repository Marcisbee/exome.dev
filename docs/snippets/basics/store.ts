// [!region import]
import { Exome } from "exome"
// [!endregion import]

// [!region classStart]
class TodoStore extends Exome {
// [!endregion classStart]
// [!region property]
  public todo: { text: string, done: boolean }[] = []
// [!endregion property]

// [!region getter]
  public get countDone() {
    return this.todo.filter(({ done }) => done).length
  }
// [!endregion getter]

// [!region action]
  public addTodo(todo: TodoStore["todo"][number]) {
    this.todo.push(todo)
  }
// [!endregion action]
// [!region classEnd]
}
// [!endregion classEnd]
