use strict;
use warnings;

use Amon2::Lite;
use Plack::Builder;
use JSON;


get '/' => sub {
    my ($c) = @_;
    $c->render("index.tt", +{
        n => 1
    });
};

get '/:path' => sub {
    my ($c, $p) = @_;

    $p->{n} = $p->{path} + 1;

    if ( $c->req->header("x-hist-xmlhttprequest") == 1 ) {
        $c->render("partial.tt", $p);
    }
    else {
        $c->render("index.tt", $p);
    }
};

builder {
    enable "Plack::Middleware::Static", path => qr/.js$/, root => "./";
    __PACKAGE__->to_app();
};

__DATA__

@@ index.tt
<!DOCTYPE HTML>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title></title>
    <style type="text/css">
        body {
            background-color: black;
            color: white;
        }
    </style>
    <script type="text/javascript">
        //var hist = {
        //    redirect: true,
        //    success: function(data) {
        //        document.getElementById("content").innerHTML = data;
        //        return true;
        //    }
        //};
    </script>
</head>
<body>
<div id="content">
<a onclick="hist.next('[% n %]')">to [% n %]</a>
</div>
    <script type="text/javascript" src="hist.js"></script>
    <script type="text/javascript">
        hist.configure({
            redirect: true,
            success: function(data) {
                document.getElementById("content").innerHTML = data;
                return true;
            }
        });
    </script>
</body>
</html>

@@ partial.tt
<a onclick="hist.next('[% n %]')">to [% n %]</a>
