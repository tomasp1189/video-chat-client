import React, { Component } from 'react';
// import _ from 'lodash';
import Pusher from 'pusher-js';
import logo from './dogeVideChat.png';
import Video from './Video';
import * as camUtils from './utils';
import './App.css';
const INIT_STATE = {
	usersOnline: 0,
	id: '',
	users: [],
	sessionDesc: '',
	currentcaller: '',
	room: '',
	caller: '',
	localUserMedia: null,
	remoteStream: null,
	forum: null
};
class App extends Component {
	state = INIT_STATE;
	componentDidMount() {
		const pusher = new Pusher('768679358ef6f38d5792', {
			cluster: 'us2',
			encrypted: true,
			authEndpoint:
				'https://wt-de5185b3aba378f7c2ad6d815fe055d2-0.sandbox.auth0-extend.com/video-chat/pusher/auth'
		});

		const forum = pusher.subscribe('presence-videocall');
		//this.notifications = pusher.subscribe( 'private-notifications-user_one' )

		forum.bind('pusher:subscription_succeeded', members => {
			let filtered = [];
			members.each(member => {
				if (member.id !== this.state.forum.members.me.id) {
					filtered.push(member.id);
				}
			});
			this.setState({
				usersOnline: members.count,
				id: this.state.forum.members.me.id,
				users: filtered
			});
		});

		forum.bind('pusher:member_added', member => {
			this.setState(prevState => ({
				users: [...prevState.users, member.id]
			}));
		});

		forum.bind('pusher:member_removed', member => {
			const index = this.state.users.indexOf(member.id);
			const users = [...this.state.users];
			users.splice(index, 1);
			this.setState(prevState => ({
				users: [...users]
			}));
			if (member.id === this.state.room) {
				this.endCall();
			}
		});

		camUtils.GetRTCPeerConnection();
		camUtils.GetRTCSessionDescription();
		camUtils.GetRTCIceCandidate();
		forum.bind('client-candidate', msg => {
			if (msg.room === this.state.room) {
				console.log('candidate received');
				this.state.caller.addIceCandidate(new RTCIceCandidate(msg.candidate));
			}
		});

		//Listening for Session Description Protocol message with session details from remote peer
		forum.bind('client-sdp', msg => {
			if (msg.room === this.state.id) {
				console.log('sdp received');
				var answer = window.confirm(
					'You have a call from: ' + msg.from + 'Would you like to answer?'
				);
				if (!answer) {
					return this.state.forum.trigger('client-reject', {
						room: msg.room,
						rejected: this.state.id
					});
				}
				this.setState({ room: msg.room });
				camUtils
					.getCam()
					.then(stream => {
						this.setState({ localUserMedia: stream });
						this.state.caller.addStream(stream);
						var sessionDesc = new RTCSessionDescription(msg.sdp);
						this.state.caller.setRemoteDescription(sessionDesc);
						this.state.caller.createAnswer().then(sdp => {
							this.state.caller.setLocalDescription(
								new RTCSessionDescription(sdp)
							);
							this.state.forum.trigger('client-answer', {
								sdp: sdp,
								room: this.state.room
							});
						});
					})
					.catch(error => {
						console.log('an error occured', error);
					});
			}
		});

		//Listening for answer to offer sent to remote peer
		forum.bind('client-answer', answer => {
			if (answer.room === this.state.room) {
				console.log('answer received');
				this.state.caller.setRemoteDescription(
					new RTCSessionDescription(answer.sdp)
				);
			}
		});

		forum.bind('client-reject', answer => {
			if (answer.room === this.state.room) {
				console.log('Call declined');
				alert('call to ' + answer.rejected + 'was politely declined');
				this.endCall();
			}
		});

		forum.bind('client-endcall', answer => {
			if (answer.room === this.state.room) {
				console.log('Call Ended');
				this.endCall();
			}
		});
		this.setState({ caller: this.prepareCaller(), forum: forum });
	}

	endCall = () => {
		this.state.caller.close();
		for (let track of this.state.localUserMedia.getTracks()) {
			track.stop();
		}
		this.setState({
			room: '',
			localUserMedia: null,
			caller: this.prepareCaller()
		});
		// this.prepareCaller();
		// toggleEndCallButton();
	};

	callUser = async user => {
		try {
			this.state.forum.bind('client-hey', () => {
				window.alert('hey');
			});
			this.state.forum.trigger('client-hey', {});
			const stream = await camUtils.getCam();
			this.state.caller.addStream(stream);
			this.setState({ localUserMedia: stream });
			const desc = await this.state.caller.createOffer();
			this.state.caller.setLocalDescription(new RTCSessionDescription(desc));

			this.state.forum.trigger('client-sdp', {
				sdp: desc,
				room: user,
				from: this.state.id
			});
			this.setState({ room: user });
		} catch (error) {
			console.log('an error occured', error);
		}
	};

	prepareCaller = () => {
		//Initializing a peer connection
		let caller = new window.RTCPeerConnection();
		//Listen for ICE Candidates and send them to remote peers
		caller.onicecandidate = evt => {
			if (!evt.candidate) return;
			console.log('onicecandidate called');
			this.onIceCandidate(caller, evt);
		};
		//onaddstream handler to receive remote feed and show in remoteview video element
		caller.onaddstream = evt => {
			console.log('onaddstream called');
			this.setState({ remoteStream: evt.stream });
		};
		return caller;
	};
	onIceCandidate = (peer, evt) => {
		if (evt.candidate) {
			this.state.forum.trigger('client-candidate', {
				candidate: evt.candidate,
				room: this.state.room
			});
		}
	};

	onEndCurrentCall = () => {
		this.state.forum.trigger('client-endcall', {
			room: this.state.room
		});
		this.endCall();
	};
	render() {
		return (
			<div className="App ">
				<header className="App-header ">
					<img
						src={logo}
						className="App-logo"
						alt="wow, such missing, much alt"
					/>
					<h1 className="App-title">Welcome to Doge Chat</h1>
				</header>
				<div className="wrapper">
					<header className="header">
						{!!this.state.id && (
							<p>
								<b> My caller id: </b>
								{this.state.id}
							</p>
						)}
					</header>
					<aside className="sidebar">
						<div id="list">
							<ul id="users" className="user-list">
								{this.state.users.map(user => {
									return (
										<li className="user-list-item" key={user}>
											<p className="caller-id">{user}</p>
											<input
												type="button"
												className="call-button"
												value="Call"
												onClick={() => {
													this.callUser(user);
												}}
												id="makeCall"
											/>
										</li>
									);
								})}
							</ul>
						</div>
					</aside>
					<article className="content">
						<div className="round-window">
							{/* <video className='test-video'></video> */}
							<Video id="selfview" srcobject={this.state.localUserMedia} />
						</div>

						<div className="round-window">
							<Video id="remoteview" srcobject={this.state.remoteStream} />
						</div>
						<button
							id="endCall"
							style={
								!!this.state.room ? { display: 'block' } : { display: 'none' }
							}
							onClick={this.onEndCurrentCall}
						>
							End Call
						</button>
					</article>
				</div>
			</div>
		);
	}
}

export default App;
