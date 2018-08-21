import React from 'react';

const Video = props => {
	return (
		<video
			autoPlay
			playsInline
			ref={video => {
				if (!!video && !!props.srcobject) video.srcObject = props.srcobject;
			}}
			{...props}
		/>
	);
};

export default Video;
