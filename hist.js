/**
 * @fileoverview Ajax history management heloper handling various environments (with pushState / with onhashchange / without both of them)
 */

(function() {
    var hist = {},
        currentLocation = location.href,
        currentHash = location.hash || "",
        hasPushState = (typeof window.history.pushState === "function"),
        hasOnHashChange = (typeof window.onhashchange === "function"),
        loading = false,
        config = {};

    var HASH_POLLING_INTERVAL = 400,
        BASE_URL = location.protocol + "//" + location.host + "/",
        PAGE_KEY = "page";


    function configure(c) {
        config = c;

        if ( config.redirect ) {
            if ( hasPushState && isHashUrl() ) {
                // new browsers which has history.pushState + hash URL
                // redirect to normal URL
                location.href = asNormalUrl(location.hash);
            }
            else if ( ! hasPushState && ! isHashUrl() ) {
                // old browsers not have history.pushState + normal URL
                // redirect to hash URL
                location.href = asHashUrl(location.href);
            }
        }
    }

    function isSSL(url) {
        return url.indexOf("https") === 0;
    }

    function isOtherDomain(url) {
        var hostname = url.split("/")[2];

        if ( hostname ) {
            return hostname !== location.hostname;
        }
        else {
            return false;
        }
    }

    function isHashUrl() {
        return (location.hash.length > 0);
    }

    function asHashUrl(url) {
        var baseUrl = config.baseUrl || BASE_URL,
            pageKey = config.pageKey || PAGE_KEY;

        if ( url.indexOf("http") === 0 ) {
            return baseUrl + "#" + pageKey + "=" + url.split("/").slice(3).join("/");
        }
        else {
            return baseUrl + "#" + pageKey + "=" + url;
        }
    }

    function asNormalUrl(hash) {
        return location.protocol + "//" + location.host + "/" + hash.substr(hash.indexOf("=") + 1);
    }

    function next(url, isPopState) {
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
                loadPage(url, isPopState);
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
            }, config.headers || { "X-Hist-XMLHttpRequest": 1 });
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
        xhr.setRequestHeader("If-Modified-Since", "Thu, 01 Jun 1970 00:00:00 GMT");

        for ( key in headers ) {
            xhr.setRequestHeader(key, headers[key]);
        }

        xhr.send();
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

    if ( window.hist ) {
        configure(window.hist);
    }

    if ( hasPushState ) {
        window.addEventListener("popstate", onPopState, false);
    }
    else {
        // if start with hash url
        if ( location.hash.indexOf("#" + (config.pageKey || PAGE_KEY)  + "=") !== -1 ) {
            onHashChange();
        }

        if ( hasOnHashChange ) {
            window.addEventListener("hashchange", onHashChange, false);
        }
        else {
            setInterval(function() {
                if ( location.hash && location.hash !== currentHash ) {
                    currentHash = location.hash;
                    onHashChange();
                }
            }, config.hashPollingInterval || HASH_POLLING_INTERVAL);
        }
    }


    hist.next = next;
    hist.configure = configure;
    window.hist = hist;

})();
