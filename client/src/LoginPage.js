import React from 'react';
import { AnchorButton } from '@blueprintjs/core';
import './main.css';
import bmo1 from './img/bmo1.gif';
import bmo2 from './img/bmo2.gif';
import bmo3 from './img/bmo3.gif';

const BMOs = [bmo1, bmo2, bmo3];
const BMOChangeRate = 10 * 1000;

class Login extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			currentBMO: 0
		};

		setInterval(this.updateBMO, BMOChangeRate);
	}

	updateBMO = () => {
		this.setState({ currentBMO: (this.state.currentBMO + 1) % 3 });
	};

	render() {
		return (
			<div className="centerChildren">
				<div
					className="background"
					style={{
						backgroundImage: `url(${BMOs[this.state.currentBMO]})`
					}}
				>
					<div className="spotify-film" />
				</div>

				<div className="tall bigger white title">Welcome</div>

				<AnchorButton
					text="login to spotify"
					href="/login"
					className="spotify-green white small-caps block thin center login-button"
				/>
			</div>
		);
	}
}

export default Login;
