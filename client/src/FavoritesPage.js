import React, { Component } from 'react';
import axios from 'axios';
import cookie from 'js-cookie';
import { debounce } from 'debounce';
import {
	Button,
	Card,
	Elevation,
	InputGroup,
	Spinner,
	Icon
} from '@blueprintjs/core';
import $ from 'jquery';
import bmo1 from './img/bmo1.gif';
import './carousel.css';
import './main.css';

var scrollerID = 0;

const scrollOnce = (elem, diff) => {
	$(elem).animate(
		{
			scrollLeft: diff
		},
		diff * 25 + 200,
		() => {
			setTimeout(() => {
				$(elem).css({
					scrollLeft: 0
				});
			}, diff * 25 + 500);
		}
	);
};

const scrollBanner = event => {
	if (event === undefined) return;

	const elem = event.target;
	const width = elem.clientWidth;
	const sWidth = elem.scrollWidth;
	const diff = sWidth - width;

	if (diff <= 0) return;

	scrollOnce(elem, diff);
	scrollerID = setInterval(() => {
		scrollOnce(elem, diff);
	}, diff * 25 + 750);
};

const resetBanner = event => {
	if (event === undefined) return;

	clearInterval(scrollerID);

	$(event.target).stop();
	event.target.scrollTo(0, 0);
};

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
			<div
				className="album-title tile__title"
				onMouseOver={scrollBanner}
				onMouseOut={resetBanner}
			>
				{album.name}
			</div>
			<div className="artist-container">
				<div
					className="artist-title tile__title"
					onMouseOver={scrollBanner}
					onMouseOut={resetBanner}
				>
					{album.artist.name}
				</div>
			</div>
		</div>
		<div className="date">in {album.release_date}</div>

		<Icon
			className="favorite-button tile__favorite bp3-dark"
			icon={album.favorite ? 'heart-broken' : 'heart'}
			iconSize="32"
			onClick={() => onFavorite({ ...album, favorite: !album.favorite })}
		/>

		{hidable ? (
			<Icon
				className="hide-button bp3-dark"
				icon="cross"
				onClick={() => onHide(album)}
			/>
		) : null}
	</Card>
);

const scrollList = dir => event => {
	const listContainer = event.target.parentNode.parentNode;
	$(listContainer).animate({
		scrollLeft: listContainer.scrollLeft + dir * window.innerWidth * 0.8
	});
};

const scrollListLeft = scrollList(-1);

const scrollListRight = scrollList(1);

const AlbumList = ({ albums, ...props }) => (
	<div className="album-container row">
		<Icon
			className="scroll-left bp3-dark"
			icon="chevron-left"
			iconSize="32"
			onClick={scrollListLeft}
		/>
		{albums.map((album, key) => (
			<Album album={album} key={key} {...props} />
		))}
		<Icon
			className="scroll-right bp3-dark"
			icon="chevron-right"
			iconSize="32"
			onClick={scrollListRight}
		/>
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

const Search = ({ onSearch, loading, ...props }) => (
	<div>
		<SearchInput onSearch={onSearch} />
		{loading ? (
			<Spinner className="spinner" intent="primary" />
		) : (
			<AlbumList {...props} />
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
			favoritesLoading: true,
			rowsPresent: 0
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
					favoritesLoading: false,
					rowsPresent:
						(data.length > 0) +
						(this.state.recommendedAlbums.length > 0 ||
							this.state.recommendationsLoading) +
						(this.state.searchAlbums.length > 0 ||
							this.state.searchLoading)
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
					recommendationsLoading: false,
					rowsPresent:
						(this.state.favoriteAlbums.length > 0 ||
							this.state.favoritesLoading) +
						(data.length > 0) +
						(this.state.searchAlbums.length > 0 ||
							this.state.searchLoading)
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
					searchLoading: false,
					rowsPresent:
						(this.state.favoriteAlbums.length > 0 ||
							this.state.favoritesLoading) +
						(this.state.recommendedAlbums.length > 0 ||
							this.state.recommendationsLoading) +
						(data.length > 0)
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
			<div>
				<div
					className="background"
					style={{
						backgroundImage: `url(${bmo1})`
					}}
				/>
				<div
					className={`content${
						this.state.rowsPresent === 3
							? ' small-albums'
							: this.state.rowsPresent === 1
								? ' big-albums'
								: ''
					}`}
				>
					<div
						className={`search-container${
							this.state.searchAlbums.length <= 0 &&
							!this.state.searchLoading
								? ' empty-box'
								: ''
						}`}
					>
						<Search
							onSearch={debounce(this.onSearch, 200)}
							albums={this.state.searchAlbums}
							loading={this.state.searchLoading}
							onFavorite={this.onFavorite}
						/>
						<Logout />
					</div>
					{this.state.favoriteAlbums.length > 0 ||
					this.state.favoritesLoading ? (
						<div className="favorites-container">
							<Favorites
								albums={this.state.favoriteAlbums}
								onFavorite={this.onFavorite}
								loading={this.state.favoritesLoading}
							/>
						</div>
					) : null}
					{this.state.recommendedAlbums.length > 0 ||
					this.state.recommendationsLoading ? (
						<div className="recommendations-container">
							<Recommendations
								onHide={this.onHide}
								albums={this.state.recommendedAlbums}
								onFavorite={this.onFavorite}
								loading={this.state.recommendationsLoading}
							/>
						</div>
					) : null}
				</div>
			</div>
		);
	}
}

export default FavoritesPage;
