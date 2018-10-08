const axios = require('axios');
const querystring = require('querystring');
const SpotifyWebApi = require('spotify-web-api-node');
const { UserModel } = require('./database');

const getUser = async (req, res) => {
	// check DB first
	const { accessToken } = req.cookies;
	const tokenUser = await UserModel.findOne({ accessToken });
	if (tokenUser) return tokenUser;
	// check Spotify and update client
	const {
		body: { id }
	} = await getSpotify(accessToken).getMe();
	const idUser = await UserModel.findById(id);
	if (idUser) {
		res.cookie('accessToken', idUser.accessToken);
		return idUser;
	}
	// logout user
	res.sendStatus(401);
};

const searchAlbumsRetry = (query, accessToken, res) => {
	const request = token =>
		getSpotify(token).searchAlbums(query, {
			limit: 10
		});
	return request(accessToken).catch(async () => {
		const newToken = await refreshToken(accessToken, res);
		return request(newToken);
	});
};

const getImage = images =>
	(images[1] && images[1].url) || '/default-album-art.jpeg';

const getArtist = artists => {
	const { name, id } = artists[0];
	return { name, id };
};

const getAlbumInfo = ({ id, name, release_date, images, artists }) => ({
	id,
	name,
	release_date,
	image: getImage(images),
	artist: getArtist(artists)
});

const searchAlbums = async (query, accessToken, res) => {
	if (query === '') return [];
	const {
		body: {
			albums: { items }
		}
	} = await searchAlbumsRetry(query, accessToken, res);
	return items.map(getAlbumInfo);
};

const spotifyRedirectURI = req =>
	`${req.protocol}://${req.get('host')}/spotify`;

const spotifyLogin = req => {
	const params = querystring.stringify({
		response_type: 'code',
		client_id: process.env.SPOTIFY_CLIENT_ID,
		redirect_uri: spotifyRedirectURI(req)
	});
	return `https://accounts.spotify.com/authorize?${params}`;
};

const getSpotifyConfig = () => {
	const auth = Buffer.from(
		`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
	).toString('base64');
	return {
		headers: {
			Authorization: `Basic ${auth}`
		}
	};
};

const getTokens = req => {
	const params = querystring.stringify({
		code: req.query.code,
		redirect_uri: spotifyRedirectURI(req),
		grant_type: 'authorization_code'
	});
	const url = `https://accounts.spotify.com/api/token?${params}`;
	return axios.post(url, null, getSpotifyConfig()).then(({ data }) => data);
};

const saveTokens = (id, accessToken, refreshToken) =>
	UserModel.findByIdAndUpdate(
		id,
		{ accessToken, refreshToken },
		{ upsert: true }
	);

const getSpotify = accessToken => {
	const spotifyApi = new SpotifyWebApi({
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET
	});
	spotifyApi.setAccessToken(accessToken);
	return spotifyApi;
};

const refreshToken = async (accessToken, res) => {
	console.log('Refreshing token');
	const { id, refreshToken } = await UserModel.findOne({ accessToken });
	const params = querystring.stringify({
		grant_type: 'refresh_token',
		refresh_token: refreshToken
	});
	const url = `https://accounts.spotify.com/api/token?${params}`;
	const {
		data: { access_token }
	} = await axios.post(url, null, getSpotifyConfig());
	res.cookie('accessToken', access_token);
	await saveTokens(id, access_token, refreshToken);
	return access_token;
};

const getRecommendations = async (favorites, accessToken) => {
	const spotify = getSpotify(accessToken);
	// TODO improve seeds
	const seed_artists = favorites.map(({ artist }) => artist.id).slice(0, 5);
	// TODO make multiple requests
	const {
		body: { tracks }
	} = await spotify.getRecommendations({ seed_artists });
	const albums = tracks.map(({ album }) => getAlbumInfo(album));
	return albums;
};

module.exports = {
	getUser,
	searchAlbums,
	getSpotify,
	spotifyLogin,
	saveTokens,
	getTokens,
	getRecommendations
};
