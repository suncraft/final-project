const express = require('express');
const router = express.Router();

const { createGroup, addMemberToGroup, getUsersGroups, getGroupMembers } = require('./helperFunctions');

module.exports = (db) => {

	// Add new group
	router.post('/', (req, res) => {
		const userID = req.session.user_id;
		const groupName = req.body.name;
		const members = req.body.members;
		members.push(userID);

		createGroup(groupName, db)
			.then(res => {
				const group = res;
				for (const member of members) {
					addMemberToGroup(member, group.id, db)
				}
				return group;
			})
			.then(group => {
				res.send(group);
			})
			.catch(err => {
				res.status(500).json({ error: err.message })
			})
	})

	// Get members belonging to specified group
	router.get('/:id', (req, res) => {
		const groupID = req.params.id;
		getGroupMembers(groupID, db)
			.then(data => res.send(data))
			.catch(err => {
				res.status(500).json({ error: err.message })
			})
	})

	// Get all groups that current user belongs to
	router.get('/', (req, res) => {
		const userID = req.session.user_id;

		getUsersGroups(userID, db)
			.then(data => res.send(data))
			.catch(err => {
				res.status(500).json({ error: err.message })
			})
	})

	return router;
}