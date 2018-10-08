import React, { Component } from 'react';
import axios from 'axios';
import cookie from 'js-cookie';
import { debounce } from 'debounce';
import { Button, Card, Elevation, InputGroup } from '@blueprintjs/core';
import './main.css';

const Album = ({ album, onFavorite }) => (
	<Card interactive={true} elevation={Elevation.ONE} className="album">
		<img
			className="album-image"
			src={album.image}
			alt={`Album artwork for ${album.name}`}
		/>
		<div className="album-title">{album.name}</div>
		<div className="artist-container">
			by
			<div className="artist-title">
				&nbsp;
				{album.artist.name}
			</div>
		</div>
		<div className="date">in {album.release_date}</div>

		<Button
			className="favorite-button small-caps"
			text={album.favorite ? 'unfavorite' : 'favorite'}
			icon={album.favorite ? 'heart-broken' : 'heart'}
			onClick={() => onFavorite({ ...album, favorite: !album.favorite })}
		/>
	</Card>
);

const AlbumList = ({ albums, onFavorite }) => (
	<div className="album-container">
		{albums.map((album, key) => (
			<Album album={album} onFavorite={onFavorite} key={key} />
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
	<div>
		<AlbumList {...props} />
	</div>
);

const Search = ({ albums, onFavorite, onSearch }) => (
	<div>
		<SearchInput onSearch={onSearch} />
		<SearchResults albums={albums} onFavorite={onFavorite} />
	</div>
);

const Favorites = props => (
	<div>
		<div className="label white big small-caps">favorites</div>
		<AlbumList {...props} />
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
			floatingSearchBar: false
		};
	}

	componentDidMount() {
		// fetch favorites from server and update favoriteAlbums
		axios
			.get('/api/favorites')
			.then(({ data }) =>
				this.setState({
					favoriteAlbums: data
				})
			)
			.catch(logout);
	}

	onFavorite = newAlbum => {
		// send favorite to server
		axios.post('/api/favorite', { newAlbum }).catch(logout);
		// change local state
		const newSearchAlbums = this.state.searchAlbums.map(
			album => (album.id === newAlbum.id ? newAlbum : album)
		);
		const newFavoriteAlbums = newAlbum.favorite
			? [newAlbum, ...this.state.favoriteAlbums]
			: this.state.favoriteAlbums.filter(({ id }) => id !== newAlbum.id);
		this.setState({
			searchAlbums: newSearchAlbums,
			favoriteAlbums: newFavoriteAlbums
		});
	};

	floatSearchBar = event => {
		const top = event.target.scrollTop;

		var float = top > 50;
		this.setState({
			floatingSearchBar: float
		});

		searchClasses =
			'search-bar ' + (this.state.floatingSearchBar ? 'float' : '-');
	};

	onSearch = query => {
		// send query to server and update searchAlbums
		axios
			.post('/api/query', { query })
			.then(({ data }) =>
				this.setState({
					searchAlbums: data
				})
			)
			.catch(logout);
	};

	render() {
		return (
			<div className="content">
				<div
					className="search-container"
					onScroll={this.floatSearchBar}
				>
					<Search
						albums={this.state.searchAlbums}
						onSearch={debounce(this.onSearch, 200)}
						onFavorite={this.onFavorite}
					/>
				</div>
				<div className="favorites-container">
					<Favorites
						albums={this.state.favoriteAlbums}
						onFavorite={this.onFavorite}
					/>
					<Logout />
				</div>
			</div>
		);
	}
}

export default FavoritesPage;
