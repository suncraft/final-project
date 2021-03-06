const bcrypt = require('bcrypt');

// Log in user
const login = (email, password, db) => {
	const query = `SELECT * FROM users WHERE email = $1`;
	const value = [email || 'null'];
	return db.query(query, value)
		.then(res => res.rows[0])
		.then(res => {
			if (res !== undefined && bcrypt.compareSync(password, res.password)) {
				return res;
			}
			return null;
		})
		.catch((err, res) => res.send(err))
}

// Create invoice for a new bill
const createInvoice = (description, cost, date, userID, group_id, includeSelf, db) => {
	const query =
		`
		INSERT INTO invoices (description, cost, created_at, poster_id, group_id)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING *;
		`;

	return getGroupMembers(group_id, db)
		.then(res => res.length)
		.then(res => {
			if (!includeSelf) {
				return res -= 1;
			}
			return res
		})
		.then(res => {
			return cost / res
		})
		.then(res => {
			const dividedCost = Math.round((res + Number.EPSILON) * 100) / 100;
			const values = [description, dividedCost, date, userID, group_id]
			return db.query(query, values)
				.then(data => data.rows[0])
				.catch(err => {
					console.error('*****QUERY ERROR:\n', err.stack);
				});
		})
}

// Get members of a certain group
const getGroupMembers = (group_id, db) => {
	const query =
		`
		SELECT * FROM user_groups
		WHERE group_id = $1;
		`;
	const values = [group_id]
	return db.query(query, values)
		.then(res => res.rows)
		.catch(err => {
			console.error('QUERY ERROR:\n', err.stack);
		});
};

// Create bill with given invoice
const createBill = (payee_id, invoice_id, db) => {
	const query =
		`
		INSERT INTO bills (payee_id, invoice_id)
		VALUES ($1, $2)
		RETURNING *;
		`;
	const values = [payee_id, invoice_id]

	db.query(query, values)
		.then(res => res.rows[0])
		.catch(err => {
			console.error('CREATE BILL QUERY ERROR:\n', err.stack);
		});
}

// Create a new group
const createGroup = (groupName, db) => {
	const query =
		`
		INSERT INTO groups (name)
		VALUES ($1)
		RETURNING *;
		`;
	const values = [groupName];

	return db.query(query, values)
		.then(res => res.rows[0])
		.catch(err => {
			console.error('QUERY ERROR:\n', err.stack);
		});
}

// Add members to group in database
const addMemberToGroup = (user_id, group_id, db) => {
	const query =
		`
		INSERT INTO user_groups (user_id, group_id)
		VALUES ($1, $2)
		RETURNING *;
		`;
	const values = [user_id, group_id];

	return db.query(query, values)
		.then(res => res.rows[0])
		.catch(err => {
			console.error('QUERY ERROR:\n', err.stack);
		});
}

// Delete specified bill from database
const deleteBill = (billID, db) => {
	const query = `DELETE FROM bills WHERE id = $1`;
	const values = [billID]

	return db.query(query, values)
		.then(res => res.rows[0])
		.catch(err => {
			console.error('QUERY ERROR:\n', err.stack);
		});
}

// Edit bill, using specified values
const editBill = (billID, updatedValues, db) => {
	if (updatedValues.paid) {
		let query = `UPDATE bills `;
		const values = [];

		values.push(updatedValues.paid);
		query += `SET paid = $1`;

		values.push(billID);
		query += ` WHERE id = $2 RETURNING *;`;

		return db.query(query, values)
			.then(res => res.rows[0])
			.catch(err => console.error('QUERY ERROR:\n', err.stack));
	} else {
		return db.query(`SELECT * FROM bills WHERE id = $1`, [billID])
			.then(res => res.rows[0])
			.catch(err => {
				console.error('QUERY ERROR:\n', err.stack);
			});
	}
}

// Edit invoice based on specified updated values
const editInvoice = (invoice_id, updatedValues, db) => {
	const query =
		`
		UPDATE invoices
		SET description = $1, cost = $2
		WHERE id = $3
		RETURNING *;
		`;

	return getGroupMembers(updatedValues.group_id, db)
		.then(res => res.length)
		.then(res => {
			if (!updatedValues.include_self) {
				return res -= 1;
			}
			return res;
		})
		.then(res => {
			return (updatedValues.cost / res);
		})
		.then(res => {
			const values = [updatedValues.description, res, invoice_id]
			return db.query(query, values)
				.then(data => data.rows[0])
				.catch(err => {
					console.error('*****QUERY ERROR:\n', err.stack);
				});
		})
}

// Get the proper user ID for an email address
const findUserByEmail = (email, db) => {
	const query = `SELECT id FROM users WHERE email = $1`;
	const values = [email];

	return db.query(query, values)
		.then(res => res.rows[0])
		.catch(err => console.error('QUERY ERROR:\n', err.stack));
}

// Check to see if there is already a row in the friends table for two users
const inFriendsTable = (userID, friendID, db) => {
	const query =
		`
		SELECT * FROM friends 
		WHERE user_first_id = $1 AND user_second_id = $2
	`;
	const values1 = [userID, friendID];
	const values2 = [friendID, userID];

	return db.query(query, values1)
		.then(res => {
			console.log('user,friend', res)
			if (res.rows.length !== 0) {
				console.log('returning TRUE')
				return true;
			}
			return db.query(query, values2)
				.then(res => {
					console.log('friend,user', res)
					if (res.rows.length !== 0) {
						console.log('** returning TRUE')
						return true;
					}
					console.log('returning FALSE')
					return false;
				})
		})
		.catch(err => console.error('QUERY ERROR:\n', err.stack));
}

// Send friend request to specified user
const sendFriendRequest = (userID, friendID, db) => {
	const query =
		`
		INSERT INTO friends (user_first_id, user_second_id)
		VALUES ($1, $2)
		RETURNING *;
	`;
	const values = [userID, friendID];

	inFriendsTable(userID, friendID, db)
		.then(res => {
			if (!res) {
				return db.query(query, values)
					.then(res => res.rows[0])
					.catch(err => console.error('QUERY ERROR:\n', err.stack));
			} else {
				return {};
			}
		})
}

// Change friend request to confirmed
const acceptFriendRequest = (userID, friendID, db) => {
	const query =
		`
		UPDATE friends
		SET confirmed = true
		WHERE user_first_id = $1 AND user_second_id = $2
		RETURNING *;
		`;
	const values = [friendID, userID];

	return db.query(query, values)
		.then(res => res.rows[0])
		.catch(err => console.error('QUERY ERROR:\n', err.stack));
}

// Delete a received friend request from the database
const declineFriendRequest = (userID, friendID, db) => {
	const query =
		`
		DELETE FROM friends
		WHERE user_first_id = $1 AND user_second_id = $2
		`;
	const values = [friendID, userID];

	return db.query(query, values)
		.then(res => res.rows[0])
		.catch(err => console.error('QUERY ERROR:\n', err.stack));
}

// Get the current users info
const getUserInfo = (userID, db) => {
	const query =
		`
		SELECT id, name, email, avatar FROM users
		WHERE id = $1
		`;
	const values = [userID];

	return db.query(query, values)
		.then(res => res.rows[0])
		.catch(err => console.error('QUERY ERROR:\n', err.stack));
}

// Get all bills that the user has posted
const getPostedBills = (userID, db) => {
	const query =
		`
		SELECT bills.id, bills.invoice_id, invoices.cost, invoices.created_at, invoices.description, invoices.group_id, bills.payee_id, bills.paid
		FROM bills
		JOIN invoices ON invoice_id = invoices.id
		WHERE invoices.poster_id = $1;
		`;
	const values = [userID];
	return db.query(query, values)
		.then(res => res.rows)
		.catch(err => console.error('QUERY ERROR:\n', err.stack));
}

// Get all of the bills the user has recieved from others
const getReceivedBills = (userID, db) => {
	const query =
		`
		SELECT bills.id, bills.invoice_id, invoices.cost, invoices.created_at, invoices.description, invoices.poster_id, invoices.group_id, bills.paid
		FROM bills
		JOIN invoices ON invoice_id = invoices.id
		WHERE payee_id = $1;
		`;
	const values = [userID];

	return db.query(query, values)
		.then(res => res.rows)
		.catch(err => console.error('QUERY ERROR:\n', err.stack));
}

// Get the total amount of money that other users owe the current user
const getTotalOwed = (userID, db) => {
	let total = 0;
	return getPostedBills(userID, db)
		.then(res => {
			for (const bill of res) {
				if (!bill.paid) {
					total += Number(bill.cost);
				}
			}
			return total;
		})
}

// Get the total amount of money that the user owes other users
const getTotalDue = (userID, db) => {
	let total = 0;
	return getReceivedBills(userID, db)
		.then(res => {
			for (const bill of res) {
				if (!bill.paid) {
					total += Number(bill.cost);
				}
			}
			return total;
		})
}

// Get all groups that the specified user is in
const getUsersGroups = (userID, db) => {
	const query =
		`
		SELECT groups.id, name FROM groups
		JOIN user_groups ON groups.id = group_id
		WHERE user_id = $1
		`;
	const values = [userID];

	return db.query(query, values)
		.then(res => res.rows)
		.catch(err => console.error('QUERY ERROR:\n', err.stack));
}

// Get bill with specified id
const getBill = (billID, db) => {
	const query =
		`
		SELECT *
		FROM bills
		JOIN invoices ON invoice_id = invoices.id
		WHERE bills.id = $1
		`;
	const values = [billID];

	return db.query(query, values)
		.then(res => (res.rows[0]))
		.catch(err => console.error('QUERY ERROR:\n', err.stack));
}


module.exports = {
	login,
	createBill,
	getGroupMembers,
	createInvoice,
	createGroup,
	addMemberToGroup,
	deleteBill,
	editBill,
	editInvoice,
	findUserByEmail,
	sendFriendRequest,
	declineFriendRequest,
	acceptFriendRequest,
	getUserInfo,
	getPostedBills,
	getReceivedBills,
	getTotalOwed,
	getTotalDue,
	getUsersGroups,
	getBill
}