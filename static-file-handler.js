import http from 'http';
import fs from 'fs/promises';

/**
 * 
 * @param {string[]} pathSegments 
 * @param {http.IncomingMessage} request 
 * @param {http.ServerResponse} response 
 */
export async function handleStaticFileRequest(pathSegments, request, response) {
    if(request.method !=='GET'){
        response.writeHead(405, {'Content-Type': 'Text/Plain'});
        response.write('405 Method Not Allowed');
        response.end();
        return;
    }

	let fileName = pathSegments[pathSegments.length - 1];
	let dotIndex = fileName.lastIndexOf('.');

	if (dotIndex === -1) {
		response.writeHead(400, { 'Content-Type': 'text/plain' });
		response.write('400 Bad Request');
		response.end();
		return;
	}

	let ext = fileName.substring(dotIndex + 1);

	let mimeType;
	if (ext === 'txt') {
		mimeType = 'text/plain;charset=UTF-8';
	} else if (ext === 'html') {
		mimeType = 'text/html;charset=UTF-8';
	} else if (ext === 'css') {
		mimeType = 'text/css;charset=UTF-8';
	} else if (ext === 'png') {
		mimeType = 'image/png';
	} else if (ext === 'webp'){
		mimeType = 'Image/webp'
	}else {
		response.writeHead(500, { 'Content-Type': 'text/plain' });
		response.write('500 Internal Server Error');
		response.end();
		return;
	}

	let filePath = pathSegments.join('/');

	let fileContents;
	try {
		fileContents = await fs.readFile('public/' + filePath);
	} catch (err) {
		if (err.code === 'ENOENT') { // ENOENT = filen finns inte
			response.writeHead(404, { 'Content-Type': 'text/plain' });
			response.write('404 Not Found');
			response.end();
			return;
		} else {
			response.writeHead(500, { 'Content-Type': 'text/plain' });
			response.write('500 Internal Server Error');
			response.end();
			return;
		}
	}

	response.writeHead(200, { 'Content-Type': mimeType });
	response.write(fileContents);
	response.end();
	// index.html
}