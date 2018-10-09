import React, { Component } from 'react';
import axios from 'axios';
import cookie from 'js-cookie';
import { debounce } from 'debounce';
import {
	Button,
	Card,
	Elevation,
	InputGroup,
	Spinner
} from '@blueprintjs/core';
import './carousel.css';
import './main.css';

const Album = ({ album, onFavorite, hidable, onHide }) => (
	<Card interactive={true} elevation={Elevation.ONE} className="album tile">
		<div className="tile_media">
			<img
				className="album-image tile__img"
				src={album.image}
				alt={`Album artwork for ${album.name}`}
			/>
		</div>
		<div className="tile__details">
			<div className="album-title tile__title">{album.name}</div>
			<div className="artist-container">
				by
				<div className="artist-title">
					&nbsp;
					{album.artist.name}
				</div>
			</div>
		</div>
		<div className="date">in {album.release_date}</div>

		<Button
			className="favorite-button small-caps"
			text={album.favorite ? 'unfavorite' : 'favorite'}
			icon={album.favorite ? 'heart-broken' : 'heart'}
			onClick={() => onFavorite({ ...album, favorite: !album.favorite })}
		/>

		{hidable ? (
			<Button
				className="hide-button small-caps"
				text="hide"
				onClick={() => onHide(album)}
			/>
		) : null}
	</Card>
);

const AlbumList = ({ albums, ...props }) => (
	<div className="album-container row__inner">
		{albums.map((album, key) => (
			<Album album={album} key={key} {...props} />
		))}
	</div>
);

var searchClasses = 'search-bar';
const SearchInput = ({ onSearch }) => (
	<InputGroup
		leftIcon="search"
		className={searchClasses}
		onChange={e => onSearch(e.target.value)}
		placeholder="Search Albums"
	/>
);

const SearchResults = props => (
	<div className="row">
		<AlbumList {...props} />
	</div>
);

const Search = ({ albums, onFavorite, onSearch, loading }) => (
	<div>
		<SearchInput onSearch={onSearch} />
		{loading ? (
			<Spinner className="spinner" intent="primary" />
		) : (
			<SearchResults albums={albums} onFavorite={onFavorite} />
		)}
	</div>
);

const Favorites = ({ loading, ...props }) => (
	<div>
		<div className="label white big small-caps">favorites</div>
		{loading ? (
			<Spinner className="spinner" intent="primary" />
		) : (
			<AlbumList {...props} />
		)}
	</div>
);

const Recommendations = ({ loading, ...props }) => (
	<div>
		<div className="label white big small-caps">recommendations</div>
		{loading ? (
			<Spinner className="spinner" intent="primary" />
		) : (
			<AlbumList hidable={true} {...props} />
		)}
	</div>
);

const logout = () => {
	cookie.remove('accessToken');
	window.location.reload(true);
};

const Logout = () => (
	<Button value="logout" className="logout-button" onClick={logout}>
		Logout
	</Button>
);

class FavoritesPage extends Component {
	constructor(props) {
		super(props);
		this.state = {
			searchAlbums: [],
			favoriteAlbums: [],
			recommendedAlbums: [],
			searchLoading: false,
			recommendationsLoading: true,
			favoritesLoading: true
		};
	}

	componentDidMount() {
		// fetch favorites from server and update favoriteAlbums
		this.fetchFavorites();
		this.fetchRecommendations();
	}

	fetchFavorites = () => {
		this.setState({
			favoritesLoading: true
		});
		axios
			.get('/api/favorites')
			.then(({ data }) =>
				this.setState({
					favoriteAlbums: data,
					favoritesLoading: false
				})
			)
			.catch(logout);
	};

	fetchRecommendations = () => {
		this.setState({
			recommendationsLoading: true
		});
		axios
			.get('/api/recommendations')
			.then(({ data }) =>
				this.setState({
					recommendedAlbums: data,
					recommendationsLoading: false
				})
			)
			.catch(logout);
	};

	onFavorite = newAlbum => {
		// send favorite to server
		axios
			.post('/api/favorite', { newAlbum })
			.then(this.fetchRecommendations)
			.catch(logout);

		// change local state
		const newSearchAlbums = this.state.searchAlbums.map(
			album => (album.id === newAlbum.id ? newAlbum : album)
		);

		const newFavoriteAlbums = newAlbum.favorite
			? [newAlbum, ...this.state.favoriteAlbums]
			: this.state.favoriteAlbums.filter(({ id }) => id !== newAlbum.id);

		const newRecommendedAlbums = this.state.recommendedAlbums.filter(
			({ id }) => id !== newAlbum.id
		);

		this.setState({
			searchAlbums: newSearchAlbums,
			favoriteAlbums: newFavoriteAlbums,
			recommendedAlbums: newRecommendedAlbums
		});
	};

	onSearch = query => {
		// send query to server and update searchAlbums

		this.setState({
			searchLoading: true
		});

		axios
			.post('/api/query', { query })
			.then(({ data }) =>
				this.setState({
					searchAlbums: data,
					searchLoading: false
				})
			)
			.catch(logout);
	};

	onHide = album => {
		axios.post('/api/hide', { album }).catch(logout);

		const newAlbums = this.state.recommendedAlbums.filter(
			({ id }) => id !== album.id
		);

		this.setState({
			recommendedAlbums: newAlbums
		});
	};

	render() {
		return (
			<div className="content">
				<div className="search-container">
					<Search
						onSearch={debounce(this.onSearch, 200)}
						albums={this.state.searchAlbums}
						loading={this.state.searchLoading}
						onFavorite={this.onFavorite}
					/>
					<Logout />
				</div>
				<div className="favorites-container">
					<Favorites
						albums={this.state.favoriteAlbums}
						onFavorite={this.onFavorite}
						loading={this.state.favoritesLoading}
					/>
				</div>
				<div className="recommendations-container">
					<Recommendations
						onHide={this.onHide}
						albums={this.state.recommendedAlbums}
						onFavorite={this.onFavorite}
						loading={this.state.recommendationsLoading}
					/>
				</div>
			</div>
		);
	}
}

export default FavoritesPage;
