import 'dotenv/config';
import http from 'http';
import { MongoClient, ObjectId } from 'mongodb';
import { getRequestBody, cleanupHTMLOutput } from './utilities.js';
import fs from 'fs/promises';
import { handleStaticFileRequest } from './static-file-handler.js';

let dbConn = await MongoClient.connect(process.env.MONGODB_CONNECTION_STRING);
export let dbo = dbConn.db(process.env.MONGODB_DATABASE_NAME);

async function handleRequest(request, response) {
	let url = new URL(request.url, 'http://' + request.headers.host);
	let path = url.pathname;
	let pathSegments = path.split('/').filter(function (segment) {
		if (segment === '' || segment === '..') {
			return false;
		} else {
			return true;
		}
	});

	let nextSegment = pathSegments.shift();

	if (nextSegment === 'static') {
		await handleStaticFileRequest(pathSegments, request, response);
		return;
	}

	if (nextSegment === 'AllwearStartsida') {
		if (request.method !== 'GET') {
			response.writeHead(405, { 'Content-Type': 'text/plain' });
			response.write('405 Method Not Allowed');
			response.end();
			return;
		}

		let documents = await dbo.collection('Lager').find().toArray();
		let profilesString = '';

		for (let i = 0; i < documents.length; i++) {
			profilesString += '<img src="/static/' + cleanupHTMLOutput(documents[i].bild) + '.webp" alt=""></img>' + '<h3>' + cleanupHTMLOutput(documents[i].Bildnamn) + '</h3>' + ' <h3>' + cleanupHTMLOutput(documents[i].pris) + '</h3> ' + ' <a href="/AllwearItem/' + cleanupHTMLOutput(documents[i]._id.toString()) + '"><button type="submit">Lägg till i varukorgen</button></a>';
		}
		let template = (await fs.readFile('Template/Allwear.Shop')).toString();

		template = template.replaceAll('%{Hemsida}%', profilesString);

		response.writeHead(200, { 'content-Type': 'text/html;charset=UTF-8' });
		response.write(template);
		response.end();
		return;
	}



	let nextnextSegment = pathSegments.shift();
	if (nextSegment === "AllwearItem" && nextnextSegment) {
		let profileDocument;
		try {
			profileDocument = await dbo.collection('Lager').findOne({
				"_id": new ObjectId(nextnextSegment)
			});
		} catch (e) {
			response.writeHead(404, { 'content-Type': 'Text/Plain' });
			response.write('404 Not found');
			response.end();
			return;
		}

		if (!profileDocument) {
			response.writeHead(404, { 'content-Type': 'Text/Plain' });
			response.write('404 Not found');
			response.end();
			return;
		}

		let template = (await fs.readFile('Template/AllwearItem.Shop')).toString();

		template = template.replaceAll('%{Bilden}%', cleanupHTMLOutput(profileDocument.bild));
		template = template.replaceAll('%{BildN}%', cleanupHTMLOutput(profileDocument.beskrivning));
		template = template.replaceAll('%{Varupris}%', cleanupHTMLOutput(profileDocument.pris));


		if (request.method === 'POST') {
			let body = await getRequestBody(request);

			let params = new URLSearchParams(body);

			if (!params.get('Storlek') || !params.get('Namn') || !params.get('Land') || !params.get('Färg') || !params.get('Adress')) {

				response.writeHead(400, { 'Content-Type': 'text/plain' });
				response.write('400 Bad Request');
				response.end();
				return;
			}

			let result = await dbo.collection('Orders').insertOne({
				'Namn': params.get('Namn'),
				'Storlek': params.get('Storlek'),
				'Färg': params.get('Färg'),
				'Land': params.get('Land'),
				'Adress': params.get('Adress')
			});

			response.writeHead(303, { 'Location': '/profiles/' + result.insertedId });
			response.end();
			return;
		}

		response.writeHead(200, { 'content-Type': 'text/html;charset=UTF-8' });
		response.write(template);
		response.end();
		return;
	}

	if (nextSegment === 'RegisterOrder') {
		if (request.method === 'POST') {
			let body = await getRequestBody(request);

			let params = new URLSearchParams(body);

			if (!params.get('Storlek') || !params.get('Namn') || !params.get('Land') || !params.get('Färg') || !params.get('Adress')) {

				response.writeHead(400, { 'Content-Type': 'text/plain' });
				response.write('400 Bad Request');
				response.end();
				return;
			}

			let result = await dbo.collection('Orders').insertOne({
				'Namn': params.get('Namn'),
				'Storlek': params.get('Storlek'),
				'Färg': params.get('Färg'),
				'Land': params.get('Land'),
				'Adress': params.get('Adress')
			});

			let template = (await fs.readFile('Template/AllwearVarukorg.Shop')).toString();
			response.writeHead(200, { 'content-Type': 'text/html;charset=UTF-8' });
			response.write(template);
			response.end();
			return;
		}


	}
}


let server = http.createServer(handleRequest);

server.listen(process.env.PORT)