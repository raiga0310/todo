import {
    Button,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListSubheader,
    Modal,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import  { Box } from "@mui/system";
import LabelIcon from "@mui/icons-material/Label";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState, FC } from "react";
import { modalInnerStyle } from "../styles/modal";
import { Label, NewLabelPayload } from "../types/todo";

type Props = {
    labels: Label[];
    filteredLabelId: number | null;
    onSelectLabel: (label: Label | null) => void;
    onSubmitNewLabel: (newLabel: NewLabelPayload) => void;
    onDeleteLabel: (id: number) => void;
};

const SideNav: FC<Props> = ({
    labels,
    filteredLabelId,
    onSelectLabel,
    onSubmitNewLabel,
    onDeleteLabel,
}) => {
    const [editName, setEditName] = useState("");
    const [openLabelModal, setOpenLabelModal] = useState(false);

    const onSubmit = () => {
        setEditName("");
        onSubmitNewLabel({ name: editName });
    }

    return (
        <>
        <List>
            <ListSubheader>Labels</ListSubheader>
            {labels.map((label) => (
                <ListItem key={label.id} disablePadding>
                    <ListItemButton
                        onClick={() => 
                            onSelectLabel(label.id === filteredLabelId ? null : label)
                        }
                        selected={label.id === filteredLabelId}
                        >
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <LabelIcon fontSize="small" />
                                <span>{label.name}</span>
                            </Stack>
                    </ListItemButton>
                </ListItem>
            ))}
            <ListItem disablePadding>
                <ListItemButton onClick={() => setOpenLabelModal(true)}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <LabelIcon fontSize="small" />
                        <span>edit Label</span>
                    </Stack>
                </ListItemButton>
            </ListItem>
        </List>
        <Modal open={openLabelModal} onClose={() => setOpenLabelModal(false)}>
            <Box sx={modalInnerStyle}>
                <Stack spacing={4}>
                    <Stack spacing={2}>
                        <Typography variant="subtitle1">new label</Typography>
                        <TextField
                            label="new label"
                            variant="filled"
                            fullWidth
                            onChange={(e) => setEditName(e.target.value)}
                        />
                        <Box textAlign="right">
                            <Button onClick={onSubmit}>submit</Button>
                        </Box>
                    </Stack>
                    <Stack spacing={2}>
                        {labels.map((label) => (
                            <Stack
                                key={label.id}
                                direction="row"
                                alignItems="center"
                                spacing={2}
                            >
                                <IconButton
                                    size="small"
                                    onClick={() => onDeleteLabel(label.id)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                                <span>{label.name}</span>
                            </Stack>
                        ))}
                </Stack>
                </Stack>
            </Box>
        </Modal>
        </>
    );
};

export default SideNav;
