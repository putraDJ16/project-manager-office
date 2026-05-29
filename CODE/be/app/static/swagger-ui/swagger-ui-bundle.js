(function () {
  function groupOperations(spec) {
    var groups = {};
    Object.keys(spec.paths || {}).forEach(function (path) {
      Object.keys(spec.paths[path]).forEach(function (method) {
        var operation = spec.paths[path][method];
        var tag = (operation.tags && operation.tags[0]) || "API";
        groups[tag] = groups[tag] || [];
        groups[tag].push({ path: path, method: method, operation: operation });
      });
    });
    return groups;
  }

  function buildRequestBody(operation) {
    if (!operation.requestBody) {
      return "";
    }
    return '<textarea rows="6" placeholder="{ }"></textarea>';
  }

  function tryItOut(baseUrl, path, method, details) {
    var token = localStorage.getItem("swagger-lite-token") || "";
    var textarea = details.querySelector("textarea");
    var output = details.querySelector("pre");
    var headers = {};
    var options = { method: method.toUpperCase(), headers: headers };

    if (token) {
      headers.Authorization = "Bearer " + token;
    }
    if (textarea && textarea.value.trim()) {
      headers["Content-Type"] = "application/json";
      options.body = textarea.value;
    }

    output.textContent = "Loading...";
    fetch(baseUrl + path, options)
      .then(function (response) {
        return response.text().then(function (body) {
          output.textContent = response.status + " " + response.statusText + "\n" + body;
        });
      })
      .catch(function (error) {
        output.textContent = error.message;
      });
  }

  window.SwaggerUIBundle = function (options) {
    var root = document.querySelector(options.dom_id);
    root.innerHTML = '<div class="swagger-lite">Loading OpenAPI spec...</div>';

    fetch(options.url)
      .then(function (response) { return response.json(); })
      .then(function (spec) {
        var baseUrl = ((spec.servers && spec.servers[0] && spec.servers[0].url) || "").replace(/\/$/, "");
        var html = '<div class="swagger-lite">';
        html += '<div class="swagger-lite__header"><div><h1>' + spec.info.title + '</h1><p>OpenAPI ' + spec.openapi + ' · v' + spec.info.version + '</p></div>';
        html += '<div class="swagger-lite__auth"><input type="password" id="swagger-lite-token" placeholder="JWT access token"><button id="swagger-lite-authorize">Authorize</button></div></div>';

        var groups = groupOperations(spec);
        Object.keys(groups).forEach(function (tag) {
          html += '<h2>' + tag + '</h2>';
          groups[tag].forEach(function (item) {
            html += '<details data-path="' + item.path + '" data-method="' + item.method + '">';
            html += '<summary><span class="swagger-lite__method ' + item.method + '">' + item.method.toUpperCase() + '</span><span>' + item.path + '<br><small>' + (item.operation.summary || "") + '</small></span></summary>';
            html += '<div class="swagger-lite__body">';
            if (item.operation.description) {
              html += '<p>' + item.operation.description + '</p>';
            }
            html += buildRequestBody(item.operation);
            html += '<p><button class="swagger-lite__try">Try it out</button></p><pre></pre></div></details>';
          });
        });
        html += '</div>';
        root.innerHTML = html;

        var tokenInput = document.getElementById("swagger-lite-token");
        tokenInput.value = localStorage.getItem("swagger-lite-token") || "";
        document.getElementById("swagger-lite-authorize").addEventListener("click", function () {
          localStorage.setItem("swagger-lite-token", tokenInput.value.trim());
        });

        root.querySelectorAll(".swagger-lite__try").forEach(function (button) {
          button.addEventListener("click", function () {
            var details = button.closest("details");
            tryItOut(baseUrl, details.dataset.path, details.dataset.method, details);
          });
        });
      })
      .catch(function (error) {
        root.innerHTML = '<div class="swagger-lite"><h1>Failed to load OpenAPI spec</h1><pre>' + error.message + '</pre></div>';
      });
  };
  window.SwaggerUIBundle.presets = { apis: [] };
})();

