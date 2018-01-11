/*
* @ Developer: Henrique César Maria
*/

'use strict';

const apiai = require('apiai');
const config = require('./config');
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const uuid = require('uuid');

var movie_list = [];
var count_movie = 0;
var responseText_m = '';
var movie_inf = '';
var movie_inf_cast = '';
var movie_inf_video = ''; 
var count_cast = 0;


// Messenger API parameters
if (!config.FB_PAGE_TOKEN) {
	throw new Error('missing FB_PAGE_TOKEN');
}
if (!config.FB_VERIFY_TOKEN) {
	throw new Error('missing FB_VERIFY_TOKEN');
}
if (!config.API_AI_CLIENT_ACCESS_TOKEN) {
	throw new Error('missing API_AI_CLIENT_ACCESS_TOKEN');
}
if (!config.FB_APP_SECRET) {
	throw new Error('missing FB_APP_SECRET');
}
if (!config.SERVER_URL) { //used for ink to static files
	throw new Error('missing SERVER_URL');
}
if (!config.WEATHER_API_KEY) { //used for weather api key
	throw new Error('missing WEATHER_API_KEY');
}
if (!config.TMDB_API_KEY) { //used for Data base movie TMDB api key
	throw new Error('missing TMDB_API_KEY');
}



app.set('port', (process.env.PORT || 5000))

//verify request came from facebook
app.use(bodyParser.json({
	verify: verifyRequestSignature
}));

//serve static files in the public directory
app.use(express.static('public'));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: false
}))

// Process application/json
app.use(bodyParser.json())


const apiAiService = apiai(config.API_AI_CLIENT_ACCESS_TOKEN, {
	language: "pt",
	requestSource: "fb"
});
const sessionIds = new Map();

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	console.log("request");
	if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === config.FB_VERIFY_TOKEN) {
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error("Failed validation. Make sure the validation tokens match.");
		res.sendStatus(403);
	}
})

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook/', function (req, res) {
	var data = req.body;
	console.log(JSON.stringify(data));



	// Make sure this is a page subscription
	if (data.object == 'page') {
		// Iterate over each entry
		// There may be multiple if batched
		data.entry.forEach(function (pageEntry) {
			var pageID = pageEntry.id;
			var timeOfEvent = pageEntry.time;

			// Iterate over each messaging event
			pageEntry.messaging.forEach(function (messagingEvent) {
				if (messagingEvent.optin) {
					receivedAuthentication(messagingEvent);
				} else if (messagingEvent.message) {
					receivedMessage(messagingEvent);
				} else if (messagingEvent.delivery) {
					receivedDeliveryConfirmation(messagingEvent);
				} else if (messagingEvent.postback) {
					receivedPostback(messagingEvent);
				} else if (messagingEvent.read) {
					receivedMessageRead(messagingEvent);
				} else {
					console.log("Webhook received unknown messagingEvent: ", messagingEvent);
				}
			});
		});

		// Assume all went well.
		// You must send back a 200, within 20 seconds
		res.sendStatus(200);
	}
});

function receivedMessage(event) {

	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;

	if (!sessionIds.has(senderID)) {
		sessionIds.set(senderID, uuid.v1());
	}
	
	var messageId = message.mid;
	var appId = message.app_id;
	var metadata = message.metadata;

	// You may get a text or attachment but not both
	var messageText = message.text;
	var messageAttachments = message.attachments;
	

	if (messageText) {
		//send message to api.ai
		var formattedMsg = messageText.toLowerCase();

		/*If movie_inf is empty it means that there are no information about movie yet,  
		* user need to pick a movie to get the information
		*/
		switch (formattedMsg) {
			case "sinopse":
				if(!movie_inf == '') {
					sendGenericMessage(senderID, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"]  							  
							}]
		    		); 
		    		sendTextMessage(senderID, movie_inf["overview"]); 
				} else {
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
				}
			break;				
			case "título original":
				if(!movie_inf == '') {
					//sendTextMessage(senderID, movie_inf["title"] + ": " + movie_inf["original_title"]); 
					sendGenericMessage(senderID, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 	
  		  					   subtitle: movie_inf["original_title"]  							  
							}]
		    		); 
				} else {
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
				}
			break;
			case "titulo original":
				if(!movie_inf == '') {
					//sendTextMessage(senderID, movie_inf["title"] + ": " + movie_inf["original_title"]); 
					sendGenericMessage(senderID, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 	
  		  					   subtitle: movie_inf["original_title"]  							  
							}]
		    		); 
				} else {
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
				}
			break;
			case "língua de origem":
			 	if(!movie_inf == '') {
					//sendTextMessage(senderID, movie_inf["title"] + ": " + movie_inf["original_language"]); 
					sendGenericMessage(senderID, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 	
  		  					   subtitle: movie_inf["original_language"]  							  
							}]
		    		); 
			 	} else {
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
			 	}
			break;
			case "lingua de origem":
				if(!movie_inf == '') {
					//sendTextMessage(senderID, movie_inf["title"] + ": " + movie_inf["original_language"]); 
					sendGenericMessage(senderID, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 	
  		  					   subtitle: movie_inf["original_language"]  							  
							}]
		    		); 
				} else {
				  	sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");	
				} 
					
			break;
			case "data":
				if(!movie_inf == '') {
					//sendTextMessage(senderID, movie_inf["title"] + ": " + movie_inf["release_date"]); 
                    sendGenericMessage(senderID, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 	
  		  					   subtitle: movie_inf["release_date"]  							  
							}]
		    		); 
				} else {
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
				}
			break;
			case "duração":
				if(!movie_inf == '') {
					//sendTextMessage(senderID, movie_inf["title"] + ": " + movie_inf["runtime"] + " min"); 
					sendGenericMessage(senderID, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 	
  		  					   subtitle: movie_inf["runtime"] + " min"  							  
							}]
		    		); 
				} else {
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
				}
			break;
			case "ranking":
				if(!movie_inf == '') {
					//sendTextMessage(senderID, movie_inf["title"] + ": " + movie_inf["vote_average"]); 
					sendGenericMessage(senderID, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 	
  		  					   subtitle: movie_inf["vote_average"] + " min"  							  
							}]
		    		); 
				} else {
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
				}
			break;
			case "rank":
				if(!movie_inf == '') {
					//sendTextMessage(senderID, movie_inf["title"] + ": " + movie_inf["vote_average"]); 
					sendGenericMessage(senderID, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 	
  		  					   subtitle: movie_inf["vote_average"] + " min"  							  
							}]
		    		); 
				} else {
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
				}
			break;
			case "popularidade":
				if(!movie_inf == '') {
					//sendTextMessage(senderID, movie_inf["title"] + ": " + movie_inf["popularity"]); 
					sendGenericMessage(senderID, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 	
  		  					   subtitle: movie_inf["popularity"]  							  
							}]
		    		); 
				} else {
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
				}
			break;
			case "status":
				if(!movie_inf == '') {
					//sendTextMessage(senderID, movie_inf["title"] + ": " + movie_inf["status"]); 
					sendGenericMessage(senderID, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 	
  		  					   subtitle: movie_inf["status"]  							  
							}]
		    		); 
				} else {
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
				}
			break;
			case "custo da produção":
				if(!movie_inf == '') {
					//sendTextMessage(senderID, movie_inf["title"] + ": " + "$: " + movie_inf["budget"]); 
					sendGenericMessage(senderID, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 	
  		  					   subtitle: movie_inf["budget"]  							  
							}]
		    		); 
				} else {
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
				}
			break;
			case "custo de produção":
				if(!movie_inf == '') {
					//sendTextMessage(senderID, movie_inf["title"] + ": " + "$: " + movie_inf["budget"]); 
					sendGenericMessage(senderID, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 	
  		  					   subtitle: movie_inf["budget"]  							  
							}]
		    		); 
				} else {
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
				}
			break;
			case "elenco":
				if(!movie_inf == '') 
					get_movie_cast(senderID, movie_inf["id"]); 
				else
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
			break;
			case "trailer":
				if(!movie_inf == '')
					get_movie_trailer(senderID, movie_inf["id"]); 
				else
					sendTextMessage(senderID, "Não tenho esta informação na minha base de dados ainda! Por favor escolha um gênero para que eu posso sugerir um filme!");
			break;

			default:
				sendToApiAi(senderID, messageText);
		} 						
	} else if (messageAttachments) {
		sendToApiAi(senderID, "Opa!, vejo que você me enviou um anexo! Desculpa mas não posso abri-lo!");
	}
}


function handleApiAiAction(sender, action, responseText, contexts, parameters) {
	switch (action) {
		case "busca-genero":
			if (parameters.hasOwnProperty("genero") && parameters["genero"]!=''){
				
				count_movie = 0;
				
				// Get movie list according defined by TMDB API
				var options = { method: 'GET',
  					url: 'https://api.themoviedb.org/3/genre/'+ getGenreId (parameters["genero"]) +'/movies',
  					qs: { 
  						sort_by: 'created_at.asc',
     					include_adult: 'false',
     					language: 'pt-BR',
     					api_key: config.TMDB_API_KEY 
     				},
  					body: '{}' 
  				};
				request(options, function (error, response, body) {
  					if(!error && response.statusCode == 200){
                          						
  						movie_list = JSON.parse(body);	
  						responseText_m = responseText;
  						
  						send_movie(sender, responseText_m, movie_list);  						
                    
  					} else {
  						console.error(response.error);
  					}  	  					
				});
			} else {
				sendTextMessage(sender, responseText);
			}
		break;
		case "tempo-hoje":
			if (parameters.hasOwnProperty("geo-city") && parameters["geo-city"]!='') {

				let apiKey = config.WEATHER_API_KEY;
				let city = parameters["geo-city"];

				// Get weather information accordind defined by openweatherAPI
				request({
					url: `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`, //URL to hit
        			
				}, function(error, response, body){
					if(!error && response.statusCode == 200){
						let weather = JSON.parse(body);
						if (weather.hasOwnProperty("weather")){
							let reply = `${responseText} ${weather["weather"][0]["description"]}, com temperatura de ${weather.main.temp} graus Celsius`;
							sendTextMessage(sender, reply); 
						} else {
							sendTextMessage(sender, `Nenhuma previsão do tempo disponível para ${parameters["geo-city"]}`);
						}
					} else {
						console.error(response.error);
					}
				});
			} else {
				sendTextMessage(sender, responseText);
			}
		break;		
		default:
			//unhandled action, just send back the text
			sendTextMessage(sender, responseText);
	}
}


function handleApiAiResponse(sender, response) {
	let responseText = response.result.fulfillment.speech;
	let responseData = response.result.fulfillment.data;
	let messages = response.result.fulfillment.messages;
	let action = response.result.action;
	let contexts = response.result.contexts;
	let parameters = response.result.parameters;

	sendTypingOff(sender);
	if (responseText == '' && !isDefined(action)) {
		//api ai could not evaluate input.
		console.log('Unknown query' + response.result.resolvedQuery);
		sendTextMessage(sender, "Ooops! Não estou certo se entendi!. Poderia ser mais específico?");
	} else if (isDefined(action)) {
		handleApiAiAction(sender, action, responseText, contexts, parameters);
	} else if (isDefined(responseData) && isDefined(responseData.facebook)) {
		try {
			console.log('Response as formatted message' + responseData.facebook);
			sendTextMessage(sender, responseData.facebook);
		} catch (err) {
			sendTextMessage(sender, err.message);
		}
	} else if (isDefined(responseText)) {

		sendTextMessage(sender, responseText);
	}
}

function sendToApiAi(sender, text) {

	sendTypingOn(sender);
	let apiaiRequest = apiAiService.textRequest(text, {
		sessionId: sessionIds.get(sender)
	});

	apiaiRequest.on('response', (response) => {
		if (isDefined(response.result)) {
			handleApiAiResponse(sender, response);
		}
	});

	apiaiRequest.on('error', (error) => console.error(error));
	apiaiRequest.end();
}


function sendTextMessage(recipientId, text) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: text
		}
	}
	callSendAPI(messageData);
}

// Send facebook generic template 
function sendGenericMessage(recipientId, elements) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "generic",
					elements: elements
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {


	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "typing_on"
	};

	callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {


	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "typing_off"
	};

	callSendAPI(messageData);
}



function greetUserText(userId) {
	//first read user firstname
	request({
		uri: 'https://graph.facebook.com/v2.7/' + userId,
		qs: {
			access_token: config.FB_PAGE_TOKEN
		}

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {

			var user = JSON.parse(body);

			if (user.first_name) {
				console.log("Facebook user: %s %s, %s",
					user.first_name, user.last_name, user.gender);

				var greet = "Olá " + user.first_name + '! ';				

				var msg = 'Meu nome é Pipoquinha. Eu sou um atendente virtual e posso te dar algumas dicas sobre filme.'
				          + 'Vamos lá! Em que posso ajudar?';
                    
                sendTextMessage(userId, greet + msg);								

			} else {
				console.log("Cannot get data for fb user with id",
					userId);
			}
		} else {
			console.error(response.error);
		}

	});
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {
			access_token: config.FB_PAGE_TOKEN
		},
		method: 'POST',
		json: messageData

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var recipientId = body.recipient_id;
			var messageId = body.message_id;

			if (messageId) {
				console.log("Successfully sent message with id %s to recipient %s",
					messageId, recipientId);				
			} else {
				console.log("Successfully called Send API for recipient %s",
					recipientId);
			}
		} else {
			console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
		}
	});
}



/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message. 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 * 
 */
function receivedPostback(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfPostback = event.timestamp;

	// The 'payload' param is a developer-defined field which is set in a postback 
	// button for Structured Messages. 
	var payload = event.postback.payload;

	if (payload === "start"){  

		greetUserText(senderID);

		movie_list = [];
		count_movie = 0;
		responseText_m = '';
		movie_inf = '';
		movie_inf_cast = '';
		movie_inf_video = ''; 
		count_cast = 0;
		
	} else if (payload === "no") {
        
        count_movie++;
        send_movie(senderID, responseText_m, movie_list);

	} else if (payload === "yes") {
        
        sendTextMessage(senderID, "Legal! Posso te dar mais informações sobre este filme? Você pode escolher estas opções: 'sinopse', título original', língua de origem', data', 'duração', 'trailer', 'elenco', 'ranking', 'popularidade', 'status' ou ' custo da produção'.");
	
	} else if (payload === "next") {
        
        count_cast++;
        send_movie_cast(senderID, movie_inf_cast);

	} else {

		switch (payload) {	
			default:
				//unindentified payload
				sendTextMessage(senderID, "Oops... Desculpa mas não entendi!");
			break;
    	}
	}	

	console.log("Received postback for user %d and page %d with payload '%s' " +
		"at %d", senderID, recipientID, payload, timeOfPostback);

}

// Receive a movie list and get movie infomation by movie ID according defined by TMDB API
function send_movie(sender, responseText_m, movie_list) {

	sendTextMessage(sender, responseText_m);
	
	if (count_movie < movie_list["results"].length) {
		    	
    	var movie = movie_list["results"][count_movie];
    	
    	var movieID = movie["id"];

    	var options = { method: 'GET',
  					url: 'https://api.themoviedb.org/3/movie/'+ movieID,
  					qs: { 
  						language: 'pt-BR',
     					api_key: config.TMDB_API_KEY 
     				},
  					body: '{}' 
  		};

		request(options, function (error, response, body) {
  			if(!error && response.statusCode == 200){
                       						
  				movie_inf = JSON.parse(body);	

  				sendGenericMessage(sender, 
  						[{ title: movie_inf["title"],  
  						   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 
  						   subtitle: "ano: " + movie_inf["release_date"] + "    rating: " + movie_inf["vote_average"],
  						   buttons: [{
                               			type: "postback",
                                    	title: "Gostei deste!",
                                    	payload: "yes"
                           			}, {
                                    	type: "postback",
                                    	title: "Sugerir outro!",
                                    	payload: "no"                           			
                           }]
						}]
		        );				
                    
  			} else {
  				console.error(response.error);
  			}  	  					
		});	

	}	

}

// Get movie trailer information according defined by TMDB API
function get_movie_trailer(sender, movieID) {

	console.log("Filme ID: " + movieID);

	var options = { method: 'GET',
  					url: 'https://api.themoviedb.org/3/movie/'+ movieID + '/videos',
  					qs: { 
  						language: 'en-US',
     					api_key: config.TMDB_API_KEY 
     				},
  					body: '{}' 
  	};

	request(options, function (error, response, body) {
  		if(!error && response.statusCode == 200) {  

  	      	var movie_inf_trailer = JSON.parse(body);
	     	var movie_trailer = movie_inf_trailer["results"][0];

	     	sendGenericMessage(sender, 
  		  					[{ title: movie_inf["title"], 
  		  					   image_url: "https://image.tmdb.org/t/p/w500" + movie_inf["poster_path"], 	
  		  					   subtitle: movie_trailer["name"],	 
  							   buttons: [{
                               			type: "web_url",
                                    	url: "https://www.youtube.com/watch?v=" + movie_trailer["key"],
                                        title: "Assista ao trailer"                          			                     			
                        	   }]
							}]
		    );      	
	                       
    	} else {
  			console.error(response.error);
  	   	}  
  	});	

}

// Get movie cast information according defined by TMDB API
function get_movie_cast(sender, movieID) {

	console.log("Filme ID: " + movieID);

	var options = { method: 'GET',
  					url: 'https://api.themoviedb.org/3/movie/'+ movieID + '/casts',
  					qs: { 
  						language: 'pt-BR',
     					api_key: config.TMDB_API_KEY 
     				},
  					body: '{}' 
  	};

	request(options, function (error, response, body) {
  		if(!error && response.statusCode == 200){         						
  	      	movie_inf_cast = JSON.parse(body);
	     	
	      	send_movie_cast(sender, movie_inf_cast);
	                       
    	} else {
  			console.error(response.error);
  	   	}  
  	});	
		
}

// Send movie cast information by facebook generic template
function send_movie_cast(sender, movie_inf_cast) {

	if (count_cast < movie_inf_cast["cast"].length) {
		
		var movie_cast = movie_inf_cast["cast"][count_cast];
		
		sendGenericMessage(sender, 
  		  					[{ title: movie_cast["name"],  
  							   image_url: "https://image.tmdb.org/t/p/w500" + movie_cast["profile_path"], 
  							   subtitle: "personagem: " + movie_cast["character"],
  							   buttons: [{
                               			type: "postback",
                                    	title: "próximo",
                                    	payload: "next"                          			                     			
                        	   }]
							}]
		);
    }    			

}

// Get genre ID according defined by TMDB API 
function getGenreId(genero) {

    switch (genero) {
        case "ação":
            return 28;

        case "terror":
            return 27;

        case "aventura":
            return 12;

        case "animação":
            return 16;

        case "comédia":
            return 35;

        case "crime":
            return 80;

        case "documentário":
            return 99;

        case "drama":
            return 18;

        case "família":
            return 10751;

        case "fantasia":
            return 14;

        case "música":
            return 10402;

        case "romance":
            return 10749;

        case "ficção científica":
            return 878;

        case "suspense":
            return 53;

        case "gerra":
            return 10752;

        default:
            return 10751;
    }
}


/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
function receivedMessageRead(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	// All messages before watermark (a timestamp) or sequence have been seen.
	var watermark = event.read.watermark;
	var sequenceNumber = event.read.seq;

	console.log("Received message read event for watermark %d and sequence " +
		"number %d", watermark, sequenceNumber);
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var delivery = event.delivery;
	var messageIDs = delivery.mids;
	var watermark = delivery.watermark;
	var sequenceNumber = delivery.seq;

	if (messageIDs) {
        
        messageIDs.forEach(function (messageID) {
			console.log("Received delivery confirmation for message ID: %s",
				messageID);
		});
	}

	console.log("All message before %d were delivered.", watermark);
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to 
 * Messenger" plugin, it is the 'data-ref' field. Read more at 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfAuth = event.timestamp;

	// The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
	// The developer can set this to an arbitrary value to associate the 
	// authentication callback with the 'Send to Messenger' click event. This is
	// a way to do account linking when the user clicks the 'Send to Messenger' 
	// plugin.
	var passThroughParam = event.optin.ref;

	console.log("Received authentication for user %d and page %d with pass " +
		"through param '%s' at %d", senderID, recipientID, passThroughParam,
		timeOfAuth);

	// When an authentication is received, we'll send a message back to the sender
	// to let them know it was successful.
	sendTextMessage(senderID, "Authentication successful");
}

/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
	var signature = req.headers["x-hub-signature"];

	if (!signature) {
		throw new Error('Couldn\'t validate the signature.');
	} else {
		var elements = signature.split('=');
		var method = elements[0];
		var signatureHash = elements[1];

		var expectedHash = crypto.createHmac('sha1', config.FB_APP_SECRET)
			.update(buf)
			.digest('hex');

		if (signatureHash != expectedHash) {
			throw new Error("Couldn't validate the request signature.");
		}
	}
}

function isDefined(obj) {
	if (typeof obj == 'undefined') {
		return false;
	}

	if (!obj) {
		return false;
	}

	return obj != null;
}

// Spin up the server
app.listen(app.get('port'), function () {
	console.log('running on port', app.get('port'))
})
