const express = require('express');
const router = express.Router();

const { findUserByEmail, sendFriendRequest, acceptFriendRequest, declineFriendRequest, getUserInfo, getTotalOwed, getTotalDue, getUsersGroups } = require('./helperFunctions');

module.exports = (db) => {

	// Get current users information
	router.get("/", (req, res) => {
		const userID = req.session.user_id;
		if (userID) {
			db.query(`SELECT * FROM users WHERE id = $1;`, [userID])
				.then(data => {
					const users = data.rows[0];
					res.send({ id: users.id, name: users.name, email: users.email });
				})
				.catch(err => {
					res
						.status(500)
						.json({ error: err.message });
				});
		} else {
			res.send({});
		}
	})

	// Get all friends of current user and friend requests
	router.get('/friends', (req, res) => {
		const userID = req.session.user_id;
		if (userID) {
			db.query(`SELECT id, name, email, avatar FROM users`)
				.then(data => {
					const users = data.rows;
					db.query(
						`
						SELECT * FROM friends 
						WHERE user_first_id = $1 OR user_second_id = $1;
						`,
						[userID])
						.then(data => {
							const friends = data.rows;
							const result = { current_friends: [], requests_recieved: [], requests_sent: [] }
							for (const friend of friends) {
								if (friend.confirmed) {
									const friend_user_id = (friend.user_first_id === Number(userID) ? friend.user_second_id : friend.user_first_id)
									for (const user of users) {
										if (user.id === friend_user_id) {
											result.current_friends.push({ id: friend.id, friend_info: user });
										}
									}
								} else if (friend.user_first_id.toString() === userID) {
									for (const user of users) {
										if (user.id === friend.user_second_id) {
											result.requests_sent.push({ id: friend.id, friend_info: user });
										}
									}
								} else if (friend.user_second_id.toString() === userID) {
									for (const user of users) {
										if (user.id === friend.user_first_id) {
											result.requests_recieved.push({ id: friend.id, friend_info: user });
										}
									}
								}
							}
							res.send(result);
						})
				})
				.catch(err => {
					res
						.status(500)
						.json({ error: err.message });
				});
		} else {
			res.send({});
		}
	})

	// Handle sending, accepting, and declineing friend requests
	router.post('/friends', (req, res) => {
		const type = req.body.type;
		const userID = req.session.user_id;

		if (type === 'sending') {
			const friendEmail = req.body.friend_info.email;
			findUserByEmail(friendEmail, db)
				.then(res => sendFriendRequest(userID, res.id, db))
				.then(data => res.send(data))
				.catch(err => {
					res.status(500).json({ error: err.message })
				})
		} else if (type === 'accepting') {
			const friendID = req.body.friend_info.id
			acceptFriendRequest(Number(userID), friendID, db)
				.then(data => res.send(data))
				.catch(err => {
					res.status(500).json({ error: err.message })
				})
		} else if (type === 'declining') {
			const friendID = req.body.friend_info.id
			declineFriendRequest(Number(userID), friendID, db)
				.then(data => res.send(data))
				.catch(err => {
					res.status(500).json({ error: err.message })
				})
		}
	})

	// Get info for current users profile page (including groups, bills, etc)
	router.get('/:id', (req, res) => {
		const userID = req.params.id;
		if (req.session.user_id === userID) {
			getUserInfo(userID, db)
				.then(userInfo => {
					return getTotalOwed(userID, db)
						.then(owed => {
							return getTotalDue(userID, db)
								.then(due => {
									return getUsersGroups(userID, db)
										.then(groups => {
											return { info: userInfo, total_owed: owed, total_due: due, groups: groups }
										})
								})
						})
				})
				.then(data => res.send(data))
				.catch(err => {
					res.status(500).json({ error: err.message });
				});
		} else {
			res.send({});
		}
	})

	return router;
};