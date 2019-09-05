class ConnectionManager
{
	constructor()
	{
		this.connect("http://localhost:3000");
	}

    connect(url)
    {
        this.socket = io(url);

        //Receive messages
        this.socket.on('message', event => {
            this.receive(event);
        });

        this.socket.on("connect", () => {
            console.log("Connection established with server");
        });
    }

	send(msg)
    {
        let data = JSON.stringify(msg);
        this.socket.send(data);
        console.log("Sending message:", msg);
    }

    receive(msg)
    {
        let data = JSON.parse(msg);
        console.log("Received message", data);

        switch(data.type) {
        	case "id": {
        		setCookie("ludsocketid", data.id);
        		break;
        	}
        	case "html": {
        		url = data.url;
        		domain = new URL(url).origin;
        		currentPath = url.split("/")[url.split("/").length - 1];
        		path = url.split("/").slice(0, url.split("/").length - 1).join("/");

        		setCookie("domain", domain);
        		setCookie("currentPath", currentPath);
        		setCookie("path", path);

        		console.log("Loading page...");

        		//Empty the page
        		document.head.innerHTML = "";
        		document.body.innerHTML = "";
       			
       			//Parse html from string
        		let html = domparser.parseFromString(data.data, "text/html");

        		html.head.prepend(domparser.parseFromString("<base href='" + domain + "/' target='_self'>", "text/html").querySelector("base")); //Make all links relative to domain
        		html.head.appendChild(domparser.parseFromString("<script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.2.0/socket.io.js'></script>", "text/html").querySelector("script"));
        		html.head.appendChild(domparser.parseFromString("<script type='text/javascript' src='" + location.origin + "/main.js'></script>", "text/html").querySelector("script"));

        		let addedClickBlock = false;
        		html.querySelectorAll("a").forEach(item => {
        			let href = item.getAttribute("href");
        			if (href) {
        				let newHref = href;
        				if (href.slice(0, 2) == "//") newHref = "https://" + href.slice(2);
        				if (href.slice(0, 1) != "/" && href.slice(0, 4) != "http") newHref = domain + "/" + href;
        				console.log(newHref);

        				item.setAttribute("href", newHref)
						item.setAttribute("alt-href", newHref);
						//item.href = "javascript:void(0)";

						if (!addedClickBlock) {
							document.addEventListener("click", blockClickHandler);

							addedClickBlock = true;
						}
        			}

        			let altHref = item.getAttribute("alt-href");
					if (altHref && altHref.replaceAll("watch?v=") != item.getAttribute("alt-href")) {
						item.setAttribute("onclick", function onclick(e) {
							playYoutubeVideo(item, item.getAttribute("alt-href"));

							return false;
						});
					} else {
						item.setAttribute("onclick", 'return submitURL(this.getAttribute("alt-href"))')
					}
	       			
				});

				html.querySelectorAll("button").forEach(item => {
        			if (item.getAttribute("href")) 
						item.setAttribute("href", "javascript:void(0)");

        			if (item.getAttribute("data-href") && item.getAttribute("data-href").slice(0, 4) == "http") 
						item.setAttribute("data-href", "javascript:void(0)");
        			
				});

        		html.querySelectorAll("iframe").forEach(item => {
					if (item.getAttribute("src")) item.src = location.origin + item.getAttribute("src");
				})

        		html.querySelectorAll("script").forEach(item => {
					if (item.getAttribute("src") && item.getAttribute("src").replaceAll(window.domain).slice(0, 3) == "../") item.src = item.getAttribute("src").replaceAll("../", "engelska/");

					if (!item.getAttribute("async")) item.setAttribute("async", "");
				})

        		html.querySelectorAll("link").forEach(item => {
					if (item.getAttribute("href") && item.getAttribute("href").replaceAll(window.domain).slice(0, 3) == "../") item.href = item.getAttribute("href").replaceAll("../", "engelska/");
				});

				html.querySelectorAll("form").forEach(item => {
					if (item.getAttribute("action") && item.getAttribute("action").slice(0, 1) != "/") item.action = path + "/" + item.getAttribute("action");
				});

				html.querySelectorAll("link").forEach(item => {
					let href = item.getAttribute("href");
					if (href && href.slice(0, 2) == "//") item.href = "https://" + href.slice(2);  
				})

        		window.htmlParsed = html;

				document.write(html.documentElement.outerHTML);

				function blockClickHandler(event) {
					event.preventDefault();
				}

				console.log(document.querySelectorAll("a").length)

				setTimeout(function() {
					document.removeEventListener("click", blockClickHandler);

					document.querySelectorAll("a").forEach(item => {

					});

					document.querySelectorAll("form").forEach(item => {

						//Youtube search
						if (item.id == "masthead-search") {
							document.getElementById("search-btn").onclick = null;
							document.getElementById("search-btn").addEventListener("click", event => {
								event.preventDefault();
								
								let query = document.getElementById("masthead-search-term").value

								submitURL("https://youtube.com" + item.getAttribute("action") + "?ludsocketid=" + getCookie("ludsocketid") + "&search_query=" + query);

								event.preventDefault();
							});
						}
					});
				}, 2000);
			
        		break;
        	}
        }
    }
}