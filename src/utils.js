//To iron over browser implementation anomalies like prefixes
export function getCam() {
	//Get local audio/video feed and show it in selfview video element
	return navigator.mediaDevices.getUserMedia({
		video: true,
		audio: true
	});
}

export function GetRTCIceCandidate() {
	window.RTCIceCandidate =
		window.RTCIceCandidate ||
		window.webkitRTCIceCandidate ||
		window.mozRTCIceCandidate ||
		window.msRTCIceCandidate;

	return window.RTCIceCandidate;
}

export function GetRTCPeerConnection() {
	window.RTCPeerConnection =
		window.RTCPeerConnection ||
		window.webkitRTCPeerConnection ||
		window.mozRTCPeerConnection ||
		window.msRTCPeerConnection;
	return window.RTCPeerConnection;
}

export function GetRTCSessionDescription() {
	window.RTCSessionDescription =
		window.RTCSessionDescription ||
		window.webkitRTCSessionDescription ||
		window.mozRTCSessionDescription ||
		window.msRTCSessionDescription;
	return window.RTCSessionDescription;
}


//Send the ICE Candidate to the remote peer

function toggleEndCallButton() {
	if (document.getElementById('endCall').style.display === 'block') {
		document.getElementById('endCall').style.display = 'none';
	} else {
		document.getElementById('endCall').style.display = 'block';
	}
}

//Listening for the candidate message from a peer sent from onicecandidate handler

