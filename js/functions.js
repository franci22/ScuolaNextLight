var x_version = "2.1.0";
var x_key_app = "ax6542sdru3217t4eesd9";

function request(req, headers, query, callback, network_error, undefined_error){
  var request = new XMLHttpRequest();
  if ($.isEmptyObject(query)) {
    var other = "";
  } else {
    var other = "?" + $.param(query);
  }
  request.open('GET', 'https://www.portaleargo.it/famiglia/api/rest/'+req+other, true);
  request.setRequestHeader("x-key-app", x_key_app);
  request.setRequestHeader("x-version", x_version);
  request.setRequestHeader("x-app-code", 'APF');
  request.setRequestHeader("x-produttore-software", 'ARGO Software s.r.l. - Ragusa');
  Object.keys(headers).forEach(function(key){
    request.setRequestHeader(key, headers[key]);
  });
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      switch (request.status) {
        case 200:
          callback.apply(request);
          break;
        case 0:
          if(network_error) network_error();
          break;
        default:
          if(undefined_error) undefined_error();
      }
    }
  }
  request.send(null);
}

function updateAlunno (token, codicescuola){
  var dfd = $.Deferred();
  request("schede", { 'x-cod-min': codicescuola, 'x-auth-token': token }, {}, function () {
    Cookies.set("alunno", this.responseText);
    dfd.resolve();
  });
  return dfd.promise();
}

function updateCache (callback1, callback2) {
  var files = [
    'index.html',
    'main.html',
    'login.html',
    'css/styles.css',
    'css/material.min.css',
    'js/main.js',
    'js/material.min.js',
    'js/functions.js',
    'js/login.js',
    'js/serviceWorkerRegister.js',
    'images/icon_round.png',
    'https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js',
    'https://unpkg.com/dialog-polyfill@latest/dialog-polyfill.js',
    'https://fonts.googleapis.com/css?family=Roboto:regular,bold,italic,thin,light,bolditalic,black,medium&amp;lang=en',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://unpkg.com/dialog-polyfill@latest/dialog-polyfill.css',
    'https://code.jquery.com/jquery-3.2.1.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery-dateFormat/1.0/jquery.dateFormat.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.1.4/js.cookie.min.js'
  ];
  window.caches.keys().then((c) => {
    if (c.length != 0){
      var request = new XMLHttpRequest();
      request.open('GET', 'https://api.github.com/repos/franci22/ScuolaNextLight', true);
      request.onreadystatechange = function () {
        if (request.readyState == 4 && request.status == 200) {
          window.caches.keys().then((caches) => {
            var json = JSON.parse(request.responseText);
            if (caches[0] != json.pushed_at) {
              window.caches.keys().then((cacheNames) => {
                cacheNames.map((cache) => {
                  if (cache !== json.pushed_at) {
                    window.caches.delete(cache);
                  }
                });
                window.caches.open(json.pushed_at)
                .then(cache => cache.addAll(files)).then(() => {
                  localStorage.clear();
                  callback1();
                });
              });
            }
          });
        }
      }
      request.send(null);
    } else {
      fetch("https://api.github.com/repos/franci22/ScuolaNextLight").then(r => r.json())
      .then(data => {
        window.caches.open(data.pushed_at)
        .then((cache) => {
          cache.addAll(files)
          .then(() => {
            console.info('All files are cached');
            callback2();
          })
          .catch((error) =>  {
            console.error('Failed to cache', error);
          })
        })
      });
    }
  });
}

function toTitleCase(str){
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function parseMaterieName(str){
  var materie_parsed = "(";
  var materie = str.replace("(", "").replace(")", "").split(",");
  materie.forEach(function (item, index){
    item = item.charAt(0).toUpperCase() + item.slice(1).toLowerCase();
    materie_parsed = materie_parsed + item;
    if(index + 1 != materie.length)
      materie_parsed = materie_parsed + ", ";
  });
  return materie_parsed + ")";
}
