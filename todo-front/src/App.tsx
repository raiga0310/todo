import { useEffect, useState, FC } from 'react';
import 'modern-css-reset';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Stack, Typography } from '@mui/material';
import { Label, NewLabelPayload, NewTodoPayload, Todo, UpdateTodoPayload } from './types/todo';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import SideNav from './components/SideNav';

import { 
  addTodoItem,
  getTodoItem,
  updateTodoItem,
  deleteTodoItem
   } from './lib/api/todo';
import { getLabelItems, addLabelItem, deleteLabelItem } from './lib/api/label';

const TodoApp: FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [filteredLabelId, setFilteredLabelId] = useState<number | null>(null);

  const onSubmit = async (payload: NewTodoPayload) => {
    await addTodoItem(payload);
    const todos = await getTodoItem();
    setTodos(todos);3
  }

  const onUpdate = async (todo: UpdateTodoPayload) => {
    await updateTodoItem(todo);
    const todos = await getTodoItem();
    setTodos(todos);
  }

  const onDelete = async (id: number) => {
    await deleteTodoItem(id);
    const todos = await getTodoItem();
    setTodos(todos);
  }

  const onSelectLabel = (label: Label | null) => {
    setFilteredLabelId(label?.id ?? null);
  }

  const onSubmitNewLabel = async (payload: NewLabelPayload) => {
    if (!labels.some((label) => label.name === payload.name)) {
      const res = await addLabelItem(payload);
      setLabels([...labels, res]);
    }
  }

  const onDeleteLabel = async (id: number) => {
    await deleteLabelItem(id);
    setLabels((prev) => prev.filter((label) => label.id !== id));
  }

  const displayTodos = filteredLabelId
    ? todos.filter((todo) => todo.labels.some((label) => label.id === filteredLabelId))
    : todos;

  useEffect(() => {
    ;(async () => {
      const todos = await getTodoItem();
      setTodos(todos);
      const labelResponse = await getLabelItems();
      setLabels(labelResponse);
    })()
  }, [])

  return (
    <>
      <Box
        sx = {{
          backgroundColor: 'white',
          borderBottom: '1px solid gray',
          display: 'flex',
          alignItems: 'center',
          position: 'fixed',
          top: 0,
          p: 2,
          width: '100%',
          height: 80,
          zIndex: 3,
        }}
      >
        <Typography variant='h1'>Todo App</Typography>
      </Box>
      <Box
        sx = {{
          backgroundColor: "white",
          borderRight: "1px solid gray",
          position: "fixed",
          height: "calc(100% - 80px)",
          width: 200,
          zIndex: 2,
          left: 0,
        }}
        >
          <SideNav
            labels={labels}
            onSelectLabel={onSelectLabel}
            filteredLabelId={filteredLabelId}
            onSubmitNewLabel={onSubmitNewLabel}
            onDeleteLabel={onDeleteLabel}
            />
        </Box>
      <Box
        sx = {{
          display: 'flex',
          justifyContent: 'center',
          p: 5,
          mt: 10,
        }}
      >
        <Box maxWidth={700} width="100%">
          <Stack spacing={5}>
            <TodoForm onSubmit={onSubmit} labels={labels} />
            <TodoList 
              todos={displayTodos}
              labels={labels}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          </Stack>
        </Box>
      </Box>
    </>
  );
}

const theme = createTheme({
  typography: {
    h1: {
      fontSize: 30,
    },
    h2: {
      fontSize: 20,
    },
  },
});

const App: FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <TodoApp />
    </ThemeProvider>
  )
}

export default App;
