import React, { Component } from 'react';
import cookie from 'js-cookie';
import FavoritesPage from './FavoritesPage';
import LoginPage from './LoginPage';

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loggedIn: !!cookie.get('accessToken')
		};
	}
	render() {
		return (
			<div>{this.state.loggedIn ? <FavoritesPage /> : <LoginPage />}</div>
		);
	}
}

export default App;
