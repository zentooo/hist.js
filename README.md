hist.js
=======

hist.js is history management helper which handles various environments ( with pushState / with onhashchange / without both of them ).


Synopsys
-------

configure before loading

    <script type="text/javascript">
        // In this case, server side have to return json formatted response ( not entire HTML )
        // if got request with X-Hist-Request header with value '1'.
        var hist = {
            success: function(data) {
                var jsonData = JSON.parse(data);
                if ( jsonData.error ) {
                    alert(jsonData.message);
                    return false;
                }
                else {
                    document.getElementById("container").innerHTML = data;
                    return true;
                }
            },
            error: function(xhr) {
                alert("ajax error");
            }
        };
    </script>
    <script type="text/javascript" src="hist.js"></script>

or configure after loading

    <script type="text/javascript" src="hist.js"></script>
    <script type="text/javascript">
        hist.configure({
            success: function(data) {
                // success callback for xhr request.
                // When this function returns true, pushState be executed.
            },
            error: function(xhr) {
                // error callback for xhr request
            },
            hashPollingInterval: 600, // hash polling interval (optional, default: 400)
            baseUrl: "http://example.com/", // base url for generating hash url (optional, default: location.protocol + "/" + location.host + "/")
            headers: { "X-FooBar": 1 }, // request header for xhr (optional, default: { "X-Hist-Request": 1 })
            pageKey: "p", // key string for hash url (optional, default: "page")
            withoutKey: false, // flag to omit "key=" of hash url (optional, default: false)
            withBang: false, // flag to add bang("!") to hash url (optional, default: false)
            ignoreSSL: true // flag to use normal transition for https:// link (optional, default: false)
        });
    </script>


Features
-------

* handling the environment with history.pushState
* handling the environment with window.onhashchange
* handling the environment without both of them
* hash url with key/value (http://example.com/#key=foo/bar)
* hash url without key (http://example.com/#foo/bar)
* hash url with key/value and bang (http://example.com/#!key=foo/bar)
* hash url without key but with bang (http://example.com/#!foo/bar)
* auto-redirect to each url with considering environment (http://example.com/foo/bar <=> http://example.com/#page=foo/bar)
