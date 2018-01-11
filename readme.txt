Teste realizado por Henrique César Maria:

Objetivos: 
	A. Desenvolvimento de uma aplicação backend integrando o messenger facebook como chatbot para realizar pesquisa e 
           dar dicas sobre filmes aos usuários.
        B. Foi integrado também a ao chatbot a capacidade de enviar informação sobre o clima de uma determinada cidade.

1. Arquitetura utilizada:
     ______             ________            _________             
    | API  |           | Backend|          |Messenger|
    | ai   |===========| App    |==========|Wenhook  |
    |______|           |________|          |_________|


2. Para o desenvolvimento da app backend foi utilizado:
   *node.js
     - express
     - body-parser
     - request


3. APIs utilizadas:
   - Dialogflow antigo (API ai): para inteligencia	
   - openwetherAPI: para consulta a base de dados sobre clima
   - TMDB API: para consulta a base de dados de filmes


4. Foi utilizado o Heroku como servidor de aplicação:
   - url: https://pipoquinha.herokuapp.com/webhook	

	


 
