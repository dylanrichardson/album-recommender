const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { UserModel, connect } = require('./database');
const {
	getUser,
	searchAlbums,
	getSpotify,
	spotifyLogin,
	saveTokens,
	getTokens,
	getRecommendations
} = require('./spotify');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// redirect to Spotify login
app.get('/login', (req, res) => {
	console.log('Connecting to Spotify');
	res.redirect(spotifyLogin(req));
});

// handle Spotify auth callback
app.get('/spotify', async (req, res) => {
	console.log('Spotify authorized');
	const { access_token, refresh_token } = await getTokens(req);
	const {
		body: { id }
	} = await getSpotify(access_token).getMe();
	res.cookie('accessToken', access_token);
	res.redirect('/');
	await saveTokens(id, access_token, refresh_token);
});

// get a user's favorite albums
app.get('/api/favorites', async (req, res) => {
	const user = await getUser(req, res);
	const favorites = user.toObject().favorites.map(album => ({
		...album,
		favorite: true
	}));
	res.json(favorites);
});

// change a user's favorite albums
app.post('/api/favorite', async (req, res) => {
	const user = await getUser(req, res);
	const { newAlbum } = req.body;
	// add or remove from favorites
	user.favorites = newAlbum.favorite
		? [newAlbum, ...user.favorites]
		: user.favorites.filter(({ id }) => id !== newAlbum.id);
	user.save();
	res.end();
});

// search Spotify and add user's favorites
app.post('/api/query', async (req, res) => {
	const user = await getUser(req, res);
	const favoriteIds = user.favorites.map(({ id }) => id);
	const { query } = req.body;
	const albums = await searchAlbums(query, user.accessToken, res);
	const albumsWithFavorite = albums.map(album => ({
		...album,
		favorite: favoriteIds.includes(album.id)
	}));
	res.json(albumsWithFavorite);
});

// recommend albums based on user's favorites
app.get('/api/recommendations', async (req, res) => {
	console.log('recommending albums');
	const user = await getUser(req, res);
	// get recommendations
	const recommendations = await getRecommendations(
		user.toObject().favorites,
		user.accessToken
	);
	// TODO filter out favorites
	// TODO filter out hidden
	res.json(recommendations);
});

// hide album recommendations for a user
app.post('/api/hide', (req, res) => {
	console.log('hiding album recommendation');
	// TODO
	res.end();
});

// Handles any requests that don't match the ones above
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '/client/build/index.html'));
});

// connect to DB then start server
connect(() => {
	const port = process.env.PORT || 8080;
	app.listen(port);
	console.log(`listening at http://localhost:${port}`);
});
