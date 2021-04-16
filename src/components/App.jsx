import React from 'react';
import { BrowserRouter, Route, Link, NavLink, Switch } from 'react-router-dom';
import { CssBaseline, Grid, Button } from '@material-ui/core';

import useStyles from './styles'

import Navbar from './Navbar'
import Home from './Home'
import CreateGroup from './CreateGroup'
import AddBill from './AddBill'
import Friends from './Friends'
import Profile from './Profile'
import Bill from './Bill'

function App() {
	const classes = useStyles();

	return (
		<>
		<BrowserRouter>
		<CssBaseline />
		<Navbar />

				<Switch>
				<Route exact path='/' component={Home}/>
        <Route path='/addbill' component={AddBill} />
        <Route path='/profile' component={Profile} />
				<Route path='/creategroup' component={CreateGroup} />
				<Route path='/friends' component={Friends} />
				<Route path='/bill' component={Bill} />
				</Switch>
		</BrowserRouter>
		</>
	);
}

export default App;


// endIcon={<Icon>send</Icon>}
//for later, if we want to add icons inside the buttons, or just use images maybe