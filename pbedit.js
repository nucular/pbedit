window.PBE = (function() {
"use strict";
var PBE = {};
var $;

PBE.PBHOST = "https://ptpb.pw";

PBE.init = function() {
  $ = Zepto;

  // Add toggle hotkey outside editor
  $("body").on("keydown", function(evt) {
    if (evt.shiftKey && evt.keyCode == 9) {
      PBE.toggle();
      evt.stopPropagation();
      evt.preventDefault();
    }
  });

  // Create ACE editor
  PBE.$container = $("<pre id='pbedit'></pre>");
  PBE.$container
    .css({
      "margin": 0,
      "position": "absolute",
      "top": 0,
      "bottom": 0,
      "left": 0,
      "right": 0,
      "z-index": 2147483647,
      "background-color": "white"
    });
  PBE.editor = ace.edit(PBE.$container[0]);
  PBE.editor.getSession().setMode("ace/mode/html");

  // Load initial source
  if (location.protocol == "data:") {
    // Data URIs require special handling
    var split = location.href.split(",");
    var data;
    if (split[0].split(";").indexOf("base64") != -1) {
      data = atob(split[1]);
    } else {
      data = split[1];
    }
    PBE.editor.setValue(data, 1);
  } else {
    $.get(location.href, function(res, status, xhr) {
      PBE.editor.setValue(res, 1);
    });
  }

  PBE.editor.commands.addCommand({
    name: "toggleEditor",
    bindKey: {win: "Shift-Tab", mac: "Shift-Tab"},
    exec: PBE.toggle
  });

  PBE.editor.commands.addCommand({
    name: "saveToDataURI",
    bindKey: {win: "Ctrl-S", mac: "Command-S"},
    exec: function() {
      PBE.saveToDataURI();
    }
  });

  PBE.editor.commands.addCommand({
    name: "saveToPB",
    bindKey: {win: "Ctrl-Shift-S", mac: "Command-Shift-S"},
    exec: function() {
      // TODO: UUID handling
      PBE.saveToPB();
    }
  });

  // Show editor
  PBE.$container.appendTo("body");
}

PBE.hide = function() {
  PBE.$container.hide();
}

PBE.show = function() {
  PBE.$container.show();
}

PBE.toggle = function() {
  PBE.$container.toggle();
}

PBE.saveToDataURI = function() {
  location.href = "data:text/html;base64," + btoa(PBE.editor.getValue());
}

PBE.saveToPB = function(uuid) {
  var fd = new FormData();
  fd.append("content", PBE.editor.getValue());
  $.ajax({
    type: uuid ? "PUT" : "POST",
    url: PBE.PBHOST + "/" + (uuid ? uuid : ""),
    processData: false,
    contentType: false,
    data: fd,
    headers: {
      "Content-Disposition": "attachment; name=c"
    },
    dataType: "json",
    success: function(res) {
      if (res.status == "created" || res.status == "already exists") {
        location.href = PBE.PBHOST + "/" + res.long + ".html";
      }
    }
  });
}

return PBE;
})();

(function() {

  function load(srcs, cb) {
    var s = document.createElement("script");
    s.src = srcs[0];
    s.async = true;
    s.onreadystatechange = s.onload = function() {
      if (!cb.done && (!s.readyState || /loaded|complete/.test(s.readyState)))
      {
        if (srcs.length > 1) {
          load(srcs.slice(1), cb);
        } else {
          cb.done = true;
          cb();
        }
      }
    }
    document.getElementsByTagName("head")[0].appendChild(s);
  }

  load([
    "https://cdnjs.cloudflare.com/ajax/libs/zepto/1.2.0/zepto.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.5/ace.js"
  ], PBE.init);
})();
