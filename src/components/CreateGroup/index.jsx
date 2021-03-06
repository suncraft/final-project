import { useState } from "react";
import {
  Typography,
  Button,
  Container,
  TextField,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  ListItemAvatar,
} from "@material-ui/core";
import GroupAddIcon from "@material-ui/icons/GroupAdd";
import useStyles from "../styles";

import useApplicationData from "../../hooks/useApplicationData";

function CreateGroup(props) {
  const { state, createGroup } = useApplicationData();
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([]);

  const classes = useStyles();
  const [checked, setChecked] = useState([1]);

  const handleToggle = (value) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];
    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }
    setChecked(newChecked);
    if (!members.includes(value)) {
      setMembers((prev) => [...prev, value]);
    } else {
      const memberIndex = members.indexOf(value);
      const updatedMembers = [...members];
      updatedMembers.splice(memberIndex, 1);
      setMembers(updatedMembers);
    }
  };

  const friends = state.friends.map((friend) => {
    const labelId = `checkbox-list-secondary-label-${friend.friend_info.id}`;
    return (
      <ListItem key={friend.friend_info.id} button>
        <ListItemIcon>
          <Checkbox
            edge="end"
            onChange={handleToggle(friend.friend_info.id)}
            inputProps={{ "aria-labelledby": labelId }}
            color="primary"
          />
        </ListItemIcon>
        <ListItemText id={labelId} primary={friend.friend_info.name} />
        <ListItemAvatar>
          <Avatar
            className={classes.friends}
            alt={`Avatar n°${friend.friend_info.id + 1}`}
            src={friend.friend_info.avatar}
          />
        </ListItemAvatar>
      </ListItem>
    );
  });

  return (
    <Container component="main" maxWidth="xs">
      <div className={classes.paper}>
        <Avatar className={classes.icon}>
          <GroupAddIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Create New Group
        </Typography>
        <form className={classes.form}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12}>
              <TextField
                autoComplete="groupName"
                name="groupName"
                variant="outlined"
                required
                fullWidth
                id="groupName"
                label="Group Name"
                autoFocus
                onChange={(event) => setGroupName(event.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={12} className={classes.groupForm}>
              <Typography component="h1" variant="subtitle1">
                Add friend(s) to group:
              </Typography>
              <List dense className={classes.root}>
                {friends}
              </List>
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={() => {
              createGroup(groupName, members);
            }}
            href={"/addbill"}
          >
            Submit
          </Button>
        </form>
      </div>
    </Container>
  );
}

export default CreateGroup;
