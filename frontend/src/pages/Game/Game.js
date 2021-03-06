import React, {useEffect, useState} from 'react';
import mapimage from '../../assets/scotlandYard/map-min.png';
import Panzoom from '@panzoom/panzoom';
import {Sidebar} from '../../components/Sidebar';
import io from 'socket.io-client';
import {API_URL} from '../../config';
import {useToasts} from 'react-toast-notifications';
let socket;

export const Game = (props) => {
	let [panzoom, setPanzoom] = useState(null);
	let [stateImg, setStateImg] = useState({});
	const {addToast} = useToasts();
	let [message,setMessage] = useState('');
	let [messages,setMessages] = useState([]);

	const showpos = (e) => {
		const ele = document.getElementById('map');

		const canvas = document.getElementById('map');
		let ctx = canvas.getContext('2d');
		let bounds = ele.getBoundingClientRect();

		// get the mouse coordinates, subtract the canvas top left and any scrolling
		let mx = e.pageX - bounds.left - window.scrollX;
		let my = e.pageY - bounds.top - window.scrollY;
		mx /= bounds.width;
		my /= bounds.height;

		mx *= canvas.width;
		my *= canvas.height;
		drawMap();
		ctx.beginPath();
		console.log('mx: ' + mx + ' my: ' + my);
		ctx.fillRect(mx, my, 15, 15);
		ctx.closePath();
	};
	
	const drawMap = () => {
		const canvas = document.getElementById('map');
		let ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		let sc = Math.min(canvas.width / stateImg.width, canvas.height / stateImg.height);
		// get the top left position of the image
		ctx.drawImage(stateImg, 0, 0, stateImg.width * sc, stateImg.height * sc);
	};
	const sendMessage = (event) => {
			event.preventDefault();

			if(message) {
				socket.emit('sendMessage',message,()=>setMessage(''));
			}
	};
	useEffect(()=>{
		const {match} = props;
		const roomCode = match.params.room;
		const username = match.params.username;
		console.log('user ', username);
		socket = io(API_URL, {query: `room=${roomCode}&username=${username}`});
	},[API_URL]);

	useEffect(() => {
		const canvas = document.getElementById('map');
		let ctx = canvas.getContext('2d');
		let img = new Image();
		img.src = mapimage;
		img.onload = function (e) {
			canvas.width = img.width;
			canvas.height = img.height;
			setStateImg(img);
			// get the scale
			let sc = Math.min(canvas.width / img.width, canvas.height / img.height);
			ctx.drawImage(img, 0, 0, img.width * sc, img.height * sc);
		};

		const elem = document.getElementById('map');
		let panzoomTemp = panzoom
			? panzoom
			: Panzoom(elem, {
					maxScale: 2,
					canvas: true,
					contain: 'outside',
			  });
		panzoomTemp.pan(10, 10);
		setPanzoom(panzoomTemp);
		elem.parentElement.addEventListener('wheel', panzoomTemp.zoomWithWheel);
		
		socket.on('test', (data) => {
			console.log(data);
		});
		socket.on('message', (message) => {
			setMessages(messages => [...messages,message]);
		});
		socket.on('playerJoin', (data) => {
			const playerName = data.playerName;
			addToast(`${playerName} just joined`, {appearance: 'success'});
		});
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<Sidebar message={message} messages={messages} setMessage = {setMessage} sendMessage={sendMessage}/>
			<div style={{width: '100%', height: '100%'}}>
				<canvas
					draggable="true"
					style={{width: '100%', height: '100%'}}
					onDoubleClick={showpos}
					id="map"></canvas>
			</div>
		</>
	);
};
