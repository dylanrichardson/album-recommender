// mongo db orm
const mongoose = require('mongoose');

// remove db warnings
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useNewUrlParser', true);

// create the Album type
const AlbumSchema = new mongoose.Schema(
	{
		id: String,
		name: String,
		artist: {
			name: String,
			id: String
		},
		release_date: String,
		image: String
	},
	{ _id: false }
);

// create the User type
const UserSchema = new mongoose.Schema({
	_id: String,
	accessToken: String,
	refreshToken: String,
	favorites: [AlbumSchema]
});

// create the User model
const UserModel = mongoose.model('User', UserSchema);

// print db errors in console
mongoose.connection.on('error', console.error);

// set the db connection handler and connect
const connect = handler => {
	const uri =
		process.env.MONGODB_URI || 'mongodb://localhost:27017/my_database_name';
	mongoose.connection.once('open', handler);
	mongoose.connect(uri);
};

// export the model and connection
module.exports = { UserModel, connect };
