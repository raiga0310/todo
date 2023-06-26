import { useState, FC } from "react";
import { Label, NewTodoPayload } from "../types/todo";
import { Box, Button, TextField, Paper, Grid, Stack, Chip, FormControlLabel, Checkbox, Modal } from '@mui/material';
import { modalInnerStyle } from "../styles/modal";
import { toggleLabel } from "../lib/toggleLabel";


type Props = {
    onSubmit: (newTodo: NewTodoPayload) => void;
    labels: Label[];
}

const TodoForm: FC<Props> = ({ onSubmit, labels }) => {
    const [edtiText, setEditText] = useState('');
    const [editLabels, setEditLabels] = useState<Label[]>([]);
    const [openLabelModal, setOpenLabelModal] = useState(false);

    const addTodoHandler = async () => {
        if (!edtiText) return;

        onSubmit({
            text: edtiText,
            labels: editLabels.map((label) => label.id),
        })
        setEditText('')
    }

    return (
        <Paper elevation={2}>
            <Box sx = {{ p: 2}}>
                <Grid container rowSpacing={2} columnSpacing={5}>
                    <Grid item xs={12}>
                        <TextField
                            label="new todo text"
                            variant="filled"
                            value={edtiText}
                            onChange={(e) => setEditText(e.target.value)}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Stack direction="row" spacing={1}>
                            {editLabels.map((label) => (
                                <Chip key={label.id} label={label.name} />
                            ))}
                        </Stack>
                    </Grid>
                    <Grid item xs={3}>
                        <Button
                            onClick={() => setOpenLabelModal(true)}
                            fullWidth
                            color="secondary"
                        >
                            Select Label
                        </Button>
                    </Grid>
                    <Grid item xs={6} />
                    <Grid item xs={3}>
                        <Button onClick={addTodoHandler} fullWidth>
                            add Todo
                        </Button>
                    </Grid>
                    <Modal open={openLabelModal} onClose={() => setOpenLabelModal(false)}>
                        <Box sx={modalInnerStyle}>
                            <Stack>
                                {labels.map((label) => (
                                    <FormControlLabel
                                        key={label.id}
                                        control={<Checkbox checked={editLabels.includes(label)} />}
                                        label={label.name}
                                        onChange={() => setEditLabels((prev) => toggleLabel(prev, label))}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    </Modal>
                </Grid>
            </Box>
        </Paper>
    )
}

export default TodoForm;
