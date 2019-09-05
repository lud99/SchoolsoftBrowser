input = document.getElementById("url");
submitBtn = document.getElementById("submitUrlBtn");
iframe = document.getElementById("websiteIframe");

url = "";
domain = "";
currentPath = "";
path = "";

host = "";

domparser = new DOMParser();

connectionManager = new ConnectionManager();

String.prototype.replaceAll = function(str1, str2 = "") {
	return this.split(str1).join(str2);
}

if (input) input.value = location.search.replaceAll("?url=");

function pathOneUp(string) {
	return string.split("/").slice(0, string.split("/").length - 1).join("/");
}

function submitURL(string) {

	if (iframe) {
		//Remove the iframe
		iframe.parentNode.removeChild(iframe);

		//Create an new iframe
		iframe = document.createElement("iframe");
		iframe.width = 1280;
		iframe.height = 720;
		iframe.id = "websiteIframe";

		document.body.appendChild(iframe);

		iframe = document.getElementById("websiteIframe");

		url = input.value;
		connectionManager.send({
			type: "url-request",
			url: input.value
		});	
	} else {
		if (string.slice(0, 4) == "http") url = string;

		if (string[0] == "/" && string[1] != "/") string = getCookie("domain") + string;
		console.log(string);

		connectionManager.send({
			type: "url-request",
			url: string
		})	
	}

	return false;
}

function playYoutubeVideo(self, url) {
	console.log(self, url);
	let container = self.parentNode.parentNode.parentNode.parentNode;
	let videoId = url.split("?v=")[1];
	let videoUrl = "https://youtube.com/embed/" + videoId;
	container.innerHTML = "<iframe src=" + videoUrl + " width=" + container.offsetWidth + " height=" + container.offsetHeight + "frameborder=\"0\" allow=\"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen>";
}

if (submitBtn) submitBtn.addEventListener("click", event => {
	submitURL();
});

function getCookie(name) {
  	var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  	if (match) {
    	return match[2];
  	}
  	else {
       console.log('invalid cookie specified');
  	}
}

function setCookie(name, value) {
	document.cookie = (name + '=' + value + ';');
}