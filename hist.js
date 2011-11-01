/** @license Naosuke Yokoe - http://github.com/zentooo/hist.js - MIT Licensed */

(function() {
    var hist = {},
        currentLocation = location.href,
        currentHash = location.hash || "",
        hasPushState = (typeof window.history.pushState === "function"),
        hasOnHashChange = (typeof window.onhashchange === "function"),
        loading = false,
        config = {};

    var hashPollingInterval = 400,
        baseUrl = location.protocol + "//" + location.host + "/",
        headers  = { "X-Hist-XMLHttpRequest": 1 },
        pageKey = "page",
        shebang;


    function configure(c) {
        var isHashUrl = (location.hash.length > 0);

        config = c;

        hashPollingInterval = c.hashPollingInterval || hashPollingInterval;
        baseUrl = c.baseUrl || baseUrl;
        headers = c.headers || headers;
        pageKey = c.pageKey || pageKey;
        shebang = c.withBang ? "#!" : "#";

        // if visit hash url at first onload
        if ( location.hash.indexOf(createHash()) !== -1 ) {
            onHashChange();
        }

        if ( config.redirect ) {
            if ( hasPushState && isHashUrl ) {
                // new browsers which has history.pushState + hash URL
                // redirect to normal URL
                location.href = asNormalUrl(location.hash);
            }
            else if ( ! hasPushState && ! isHashUrl ) {
                // old browsers not have history.pushState + normal URL
                // redirect to hash URL
                location.href = asHashUrl(location.href);
            }
        }

        if ( hasPushState ) {
            window.addEventListener("popstate", onPopState, false);
        }
        else {
            if ( hasOnHashChange ) {
                window.addEventListener("hashchange", onHashChange, false);
            }
            else {
                setInterval(function() {
                    if ( location.hash.length > 1 && location.hash !== currentHash ) {
                        currentHash = location.hash;
                        onHashChange();
                    }
                }, hashPollingInterval);
            }
        }

        function onPopState(evt) {
            if ( currentLocation !== location.href ) {
                loadPage(location.href, true);
                currentLocation = location.href;
            }
        }

        function onHashChange() {
            loadPage(asNormalUrl(location.hash));
        }
    }

    function isSSL(url) {
        return url.indexOf("https") === 0;
    }

    function isOtherDomain(url) {
        // http://{example.com}/ => split("/")[2]
        var host = url.split("/")[2];

        if ( url.indexOf("http") !== 0 ) {
            return false;
        }
        else if ( host ) {
            return host !== location.host;
        }
        else {
            return false;
        }
    }

    function asHashUrl(url) {
        // with absolute URL, we need http://example.com/{foo/bar}
        if ( url.indexOf("http") === 0 ) {
            return baseUrl + createHash(url.split("/").slice(3).join("/"));
        }
        // with relative URL, we need URL itself
        else {
            return baseUrl + createHash(url);
        }
    }

    function createHash(url) {
        if ( config.withoutKey ) {
            return shebang + (url || "");
        }
        else {
            return shebang + pageKey + "=" + (url || "");
        }
    }

    function asNormalUrl(hash) {
        if ( config.withoutKey ) {
            // hash.substr extracts: with bang => #!{foo}, without bang => #{foo}
            return location.protocol + "//" + location.host + "/" + (config.withBang ? hash.substr(2) : hash.substr(1));
        }
        else {
            // hash.substr extracts: #key={value}
            return location.protocol + "//" + location.host + "/" + hash.substr(hash.indexOf("=") + 1);
        }
    }

    function next(url) {
        if ( config.ignoreSSL && isSSL(url) ) {
            location.href = url;
        }
        else if ( isOtherDomain(url) ) {
            location.href = url;
        }
        else {
            if ( ! hasPushState ) {
                location.href = asHashUrl(url);
            }
            else {
                loadPage(url);
            }
        }
    }

    function loadPage(url, isPopState) {
        if ( ! loading ) {
            loading = true;

            ajax(url, function(data, xhr) {
                var ok = config.success(data, xhr);

                loading = false;

                if ( ok && hasPushState && ! isPopState ) {
                    window.history.pushState(null, "", url);
                    currentLocation = url;
                }
            }, function(xhr) {

                loading = false;

                if ( typeof config.error === "function" ) {
                    config.error(xhr);
                }
            }, headers);
        }
    }

    function ajax(url, success, error, headers) {
        var xhr = new XMLHttpRequest(),
            success = success || function() {},
            error = error || function() {},
            headers = headers || {},
            key;

        xhr.onreadystatechange = function() {
            if ( xhr.readyState === 4 ) {
                if ( xhr.status >= 200 && xhr.status < 300 ) {
                    success(xhr.responseText, xhr);
                } else {
                    error(xhr);
                }
            }
        };

        xhr.open("GET", url, true);

        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.setRequestHeader("Pragma", "no-cache");
        xhr.setRequestHeader("Cache-Control", "no-cache");
        xhr.setRequestHeader("If-Modified-Since", "Thu, 01 Jun 1970 00:00:00 GMT");

        for ( key in headers ) {
            xhr.setRequestHeader(key, headers[key]);
        }

        xhr.send();
    }

    if ( window.hist ) {
        configure(window.hist);
    }

    hist.next = next;
    hist.configure = configure;
    window.hist = hist;

})();
