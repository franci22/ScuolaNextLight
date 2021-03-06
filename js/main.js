var session = Cookies.getJSON("session");
var codicescuola = Cookies.get("codicescuola");
var current_date;
var alunno;
var materie_container;

$(function(){
  updateMain();
  updateCache(function () {
    var notification = $('.mdl-js-snackbar')[0];
    notification.MaterialSnackbar.showSnackbar({
      message: 'Aggiornamento completato',
      timeout: 10000,
      actionHandler: function (event) {
        window.location.reload();
      },
      actionText: 'Ricarica'
    });
  }, function () {
    var notification = $('.mdl-js-snackbar')[0];
    notification.MaterialSnackbar.showSnackbar({
      message: 'L\'applicazione è stata salvata sul dispositivo per velocizzarne l\'uso.',
      timeout: 5000
    });
  });

  $("#oggi-datepicker").addClass("mdl-datepicker mdl-js-datepicker mdl-datepicker--inline is-visible");
  MaterialDatePicker.locales.weekStart = 1;
  MaterialDatePicker.locales.weekDays = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  MaterialDatePicker.locales.weekDaysShort = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  MaterialDatePicker.locales.weekDaysLetter = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
  MaterialDatePicker.locales.months = [
    'Gennaio', 'Febbraio', 'Marzo',
    'Aprile', 'Maggio', 'Giugno', 'Luglio',
    'Agosto', 'Settembre', 'Ottobre',
    'Novembre', 'Dicembre'
  ];
  MaterialDatePicker.locales.monthsShort = [
    'Gen', 'Feb', 'Mar', 'Apr', 'Mag',
    'Giu', 'Lug', 'Ago', 'Set', 'Ott',
    'Nov', 'Dic'
  ];
  MaterialDatePicker.locales.actions.cancel = "Annulla";
  componentHandler.upgradeDom();

  var oggiPicker = $('#oggi-datepicker')[0];
  oggiPicker.MaterialDatePicker.setRange(null, new Date());
  oggiPicker.addEventListener('change', function(e) {
    oggiDatepickerDialogElement.close();
    var selectedDate = oggiPicker.MaterialDatePicker.getSelectedDate();
    current_date = $.format.date(selectedDate, "yyyy-MM-dd");
    fillOggi(current_date);
  });
  oggiPicker.addEventListener('cancel', function() {
    oggiDatepickerDialogElement.close();
  });
});

function updateMain(){
  var fill = function () {
    alunno = Cookies.getJSON("alunno");
    current_date = $.format.date(new Date(), "yyyy-MM-dd");
    fillOggi(current_date);
  }
  if (!Cookies.get("alunno")) {
    updateAlunno(session.token, codicescuola).then(fill);
  } else {
    fill();
  }
}

function fillOggi(day) {
  var nav_loading = $("#nav-loading")[0];
  if(nav_loading.MaterialSpinner) nav_loading.MaterialSpinner.start();
  var argomenti_ul = $("#argomenti-lezione");
  var compiti_ul = $("#compiti-assegnati");
  var voti_ul = $("#voti-giornalieri");
  $("#oggi-date-text").text("");
  argomenti_ul.empty();
  $("#argomenti-loading").show();
  compiti_ul.empty();
  $("#compiti-loading").show();
  voti_ul.empty();
  $("#voti-loading").show();

  var oggi_fill_f = function (data) {
    var oggi = JSON.parse(data);
    oggi.dati.forEach(function (element) {
      if (element.tipo == "ARG") {
        i_argomenti++;
        $('<div/>', {
          "class": "oggi-text",
          html: [$('<span/>', {
            "class": "materia",
            text: element.dati.desMateria.charAt(0).toUpperCase() + element.dati.desMateria.slice(1).toLowerCase()
          }), $('<span/>', {
            "class": "info",
              html: element.dati.desArgomento + '<br />' + toTitleCase(element.dati.docente)
          })]
        }).appendTo(argomenti_ul);
      } else if (element.tipo == "COM") {
        i_compiti++;
        $('<div/>', {
          "class": "oggi-text",
          html: [$('<span/>', {
            "class": "materia",
            text: element.dati.desMateria.charAt(0).toUpperCase() + element.dati.desMateria.slice(1).toLowerCase()
          }), $('<span/>', {
            "class": "info",
            html: element.dati.desCompiti + '<br />' + toTitleCase(element.dati.docente)
          })]
        }).appendTo(compiti_ul);
      } else if (element.tipo == "VOT") {
        i_voti++;
        if (element.dati.desCommento == "" && element.dati.desProva == "") {
          element.dati.desCommento = "Nessun commento.";
        }
        if (element.dati.codVotoPratico == "N") {
          var tipo = " (orale)";
        } else if (element.dati.codVotoPratico == "S") {
          var tipo = " (scritto)";
        } else if (element.dati.codVotoPratico == "P"){
          var tipo = " (pratico)";
        }
        $('<div/>', {
          "class": "oggi-text",
          html: [$('<span/>', {
            "class": "materia",
            html: element.dati.desMateria.charAt(0).toUpperCase() + element.dati.desMateria.slice(1).toLowerCase() + tipo + ' <span class="mdl-chip chip-voto mdl-color--' + colore_voto(element.dati.decValore) + ' mdl-color-text--white"><span class="mdl-chip__text">' + element.dati.codVoto + '</span></span>'
          }), $('<span/>', {
            "class": "info",
            html: element.dati.desProva + ' ' + element.dati.desCommento + '<br />' + toTitleCase(element.dati.docente)
          })]
        }).appendTo(voti_ul);
      }
    });

    if (i_voti == 0) {
      voti_ul.append("<h6>Nessun voto.</h5>");
    }
    if (i_argomenti == 0) {
      argomenti_ul.append("<h6>Nessun argomento.</h5>");
    }
    if (i_compiti == 0) {
      compiti_ul.append("<h6>Nessun compito.</h5>");
    }

    $("#argomenti-loading").hide();
    $("#compiti-loading").hide();
    $("#voti-loading").hide();

    nav_loading.MaterialSpinner.stop();
    $("#oggi-date-text").text($.format.date(Date.parse(day), "dd/MM/yyyy"));
  };

  var i_argomenti = 0, i_compiti = 0, i_voti = 0;
  request("oggi", { 'x-cod-min': codicescuola, 'x-auth-token': session.token, 'x-prg-alunno': alunno[0].prgAlunno, 'x-prg-scheda': alunno[0].prgScheda, 'x-prg-scuola': alunno[0].prgScuola },  { 'datGiorno': day }, function () {
    oggi_fill_f(this.responseText);
    if (Storage) {
      localStorage.setItem("cache_oggi_" + day, this.responseText);
      localStorage.setItem("cache_oggi_date_" + day, $.format.date(new Date(), "HH:mm dd/MM/yyyy"));
    }
  }, function () {
    if (localStorage.getItem("cache_oggi_date_" + day)) {
      oggi_fill_f(localStorage.getItem("cache_oggi_" + day));
      var notification = $('.mdl-js-snackbar')[0];
      notification.MaterialSnackbar.showSnackbar({
          message: 'Errore di rete. Ultimo aggiornamento: ' + localStorage.getItem("cache_oggi_date_" + day),
          timeout: 4000
      });
    } else {
      var notification = $('.mdl-js-snackbar')[0];
      notification.MaterialSnackbar.showSnackbar({
          message: 'Errore di rete',
          timeout: 10000,
          actionHandler: function (event) {
            fillOggi(current_date);
            notification.MaterialSnackbar.hideSnackbar();
          },
          actionText: 'Riprova'
      });

      $("#argomenti-loading").hide();
      $("#compiti-loading").hide();
      $("#voti-loading").hide();
      nav_loading.MaterialSpinner.stop();
      voti_ul.append("<h6>Errore di rete.</h5>");
      argomenti_ul.append("<h6>Errore di rete.</h5>");
      compiti_ul.append("<h6>Errore di rete.</h5>");
    }
  }, function () {
    var notification = $('.mdl-js-snackbar')[0];
    notification.MaterialSnackbar.showSnackbar({
        message: 'Errore. Prova ad effettuare il lougut e a rientrare.',
        timeout: 10000,
        actionHandler: function (event) {
          logoutDialogElement.showModal();
          notification.MaterialSnackbar.hideSnackbar();
        },
        actionText: 'Logout'
    });

    $("#argomenti-loading").hide();
    $("#compiti-loading").hide();
    $("#voti-loading").hide();
    nav_loading.MaterialSpinner.stop();
    voti_ul.append("<h6>Errore di rete.</h5>");
    argomenti_ul.append("<h6>Errore di rete.</h5>");
    compiti_ul.append("<h6>Errore di rete.</h5>");
  });
}

function fillMaterie(start = 0, end = 0) {
  var nav_loading = $("#nav-loading")[0];
  nav_loading.MaterialSpinner.start();
  $(".voti-materia").empty();
  $(".argomenti-materia").empty();
  $(".compiti-materia").empty();

  //Voti
  var voti_fill_f = function (data) {
    var voti = JSON.parse(data);
    voti.dati.forEach(function (element) {
      if ((start == 0 && end == 0) || (Date.parse(element.datGiorno)/1000 > start && Date.parse(element.datGiorno)/1000 < end)) {
        createMaterieDiv(element.prgMateria, element.desMateria);

        if (element.desCommento == "" && element.desProva == "") {
          element.desCommento = "Nessun commento.";
        }
        if (element.codVotoPratico == "N") {
          var tipo = " (orale)";
        } else if (element.codVotoPratico == "S") {
          var tipo = " (scritto)";
        } else if (element.codVotoPratico == "P") {
          var tipo = " (pratico)";
        }
        $('<div/>', {
          "class": "oggi-text",
          html: [$('<span/>', {
            "class": "materia",
            html: $.format.date(Date.parse(element.datGiorno), "dd/MM/yyyy") + tipo + ' <span class="mdl-chip chip-voto mdl-color--' + colore_voto(element.decValore) + ' mdl-color-text--white"><span class="mdl-chip__text">' + element.codVoto + '</span></span>'
          }), $('<span/>', {
            "class": "info",
            html: element.desProva + ' ' + element.desCommento + '<br />' + toTitleCase(element.docente)
          })]
        }).appendTo($("#voti-materia-"+element.prgMateria));
      }
    });
  };
  var f_voti = function () {
    var dfd = $.Deferred();
    request("votigiornalieri", { 'x-cod-min': codicescuola, 'x-auth-token': session.token, 'x-prg-alunno': alunno[0].prgAlunno, 'x-prg-scheda': alunno[0].prgScheda, 'x-prg-scuola': alunno[0].prgScuola }, {}, function () {
      voti_fill_f(this.responseText);
      if (Storage) {
        localStorage.setItem("cache_voti", this.responseText);
        localStorage.setItem("cache_voti_date", $.format.date(new Date(), "HH:mm dd/MM/yyyy"));
      }
      dfd.resolve();
    }, function () {
      dfd.reject(1);
    }, function () {
      dfd.reject(2);
    });
    return dfd.promise();
  }

  //Argomenti
  var argomenti_fill_f = function (data) {
    var argomenti = JSON.parse(data);
    argomenti.dati.forEach(function (element) {
      if ((start == 0 && end == 0) || (Date.parse(element.datGiorno)/1000 > start && Date.parse(element.datGiorno)/1000 < end)) {
        createMaterieDiv(element.prgMateria, element.desMateria);
        $('<div/>', {
          "class": "oggi-text",
          html: [$('<span/>', {
            "class": "materia",
            text: $.format.date(Date.parse(element.datGiorno), "dd/MM/yyyy")
          }), $('<span/>', {
            "class": "info",
            html: element.desArgomento + '<br />' + toTitleCase(element.docente)
          })]
        }).appendTo($("#argomenti-materia-"+element.prgMateria));
      }
    });
  };
  var f_argomenti = function () {
    var dfd = $.Deferred();
    request("argomenti", { 'x-cod-min': codicescuola, 'x-auth-token': session.token, 'x-prg-alunno': alunno[0].prgAlunno, 'x-prg-scheda': alunno[0].prgScheda, 'x-prg-scuola': alunno[0].prgScuola }, {}, function () {
      argomenti_fill_f(this.responseText);
      if (Storage) {
        localStorage.setItem("cache_argomenti", this.responseText);
        localStorage.setItem("cache_argomenti_date", $.format.date(new Date(), "HH:mm dd/MM/yyyy"));
      }
      dfd.resolve();
    }, function () {
      dfd.reject(1);
    }, function () {
      dfd.reject(2);
    });
    return dfd.promise();
  }

  //Compiti
  var compiti_fill_f = function (data) {
    var compiti = JSON.parse(data);
    compiti.dati.forEach(function (element) {
      if ((start == 0 && end == 0) || (Date.parse(element.datGiorno)/1000 > start && Date.parse(element.datGiorno)/1000 < end)) {
        createMaterieDiv(element.prgMateria, element.desMateria);
        $('<div/>', {
          "class": "oggi-text",
          html: [$('<span/>', {
            "class": "materia",
            text: $.format.date(Date.parse(element.datGiorno), "dd/MM/yyyy")
          }), $('<span/>', {
            "class": "info",
            html: element.desCompiti + '<br />' + toTitleCase(element.docente)
          })]
        }).appendTo($("#compiti-materia-"+element.prgMateria));
      }
    });
  };
  var f_compiti = function () {
    var dfd = $.Deferred();
    request("compiti", { 'x-cod-min': codicescuola, 'x-auth-token': session.token, 'x-prg-alunno': alunno[0].prgAlunno, 'x-prg-scheda': alunno[0].prgScheda, 'x-prg-scuola': alunno[0].prgScuola }, {}, function () {
      compiti_fill_f(this.responseText);
      if (Storage) {
        localStorage.setItem("cache_compiti", this.responseText);
        localStorage.setItem("cache_compiti_date", $.format.date(new Date(), "HH:mm dd/MM/yyyy"));
      }
      dfd.resolve();
    }, function () {
      dfd.reject(1);
    }, function () {
      dfd.reject(2);
    });
    return dfd.promise();
  }

  f_voti().then(f_argomenti).then(f_compiti).then(function () {
    materie_container = $('#materie-container').masonry({
      itemSelector: '.mdl-cell'
    });
    $(".reload-mc-masonry").click(function () {
      materie_container.masonry();
    });
    nav_loading.MaterialSpinner.stop();
    $(".voti-materia:empty").append("<h6>Nessun voto.</h6>");
    $(".argomenti-materia:empty").append("<h6>Nessun argomento.</h6>");
    $(".compiti-materia:empty").append("<h6>Nessun compito.</h6>");
  }).fail(function (e) {
    switch (e) {
      case 1:
        if (localStorage.getItem("cache_voti_date")) {
          voti_fill_f(localStorage.getItem("cache_voti"));
          var date_cache = localStorage.getItem("cache_voti_date");
        }
        if (localStorage.getItem("cache_argomenti_date")) {
          argomenti_fill_f(localStorage.getItem("cache_argomenti"));
          var date_cache = localStorage.getItem("cache_argomenti_date");
        }
        if (localStorage.getItem("cache_compiti_date")) {
          compiti_fill_f(localStorage.getItem("cache_compiti"));
          var date_cache = localStorage.getItem("cache_compiti_date");
        }
        if (date_cache) {
          var notification = $('.mdl-js-snackbar')[0];
          notification.MaterialSnackbar.showSnackbar({
              message: 'Errore di rete. Ultimo aggiornamento: ' + date_cache,
              timeout: 4000
          });
          materie_container = $('#materie-container').masonry({
            itemSelector: '.mdl-cell'
          });
          $(".reload-mc-masonry").click(function () {
            materie_container.masonry();
          });
          nav_loading.MaterialSpinner.stop();
          $(".voti-materia:empty").append("<h6>Nessun voto.</h6>");
          $(".argomenti-materia:empty").append("<h6>Nessun argomento.</h6>");
          $(".compiti-materia:empty").append("<h6>Nessun compito.</h6>");
        } else {
          var notification = $('.mdl-js-snackbar')[0];
          notification.MaterialSnackbar.showSnackbar({
              message: 'Errore di rete',
              timeout: 10000,
              actionHandler: function (event) {
                fillMaterie();
                notification.MaterialSnackbar.hideSnackbar();
              },
              actionText: 'Riprova'
          });
        }
        break;
      case 2:
        var notification = $('.mdl-js-snackbar')[0];
        notification.MaterialSnackbar.showSnackbar({
            message: 'Errore. Prova ad effettuare il lougut e a rientrare.',
            timeout: 10000,
            actionHandler: function (event) {
              logoutDialogElement.showModal();
              notification.MaterialSnackbar.hideSnackbar();
            },
            actionText: 'Logout'
        });
        break;
    }
    $(".materie-container").empty();
    nav_loading.MaterialSpinner.stop();
  });
}

function createMaterieDiv(id, nome){
  if (!$("#cell-materia-"+id).length) {
    $('<div/>', {
      "class": "mdl-cell mdl-cell--4-col",
      "id": "cell-materia-" + id,
      html: $('<div/>', {
        "class": "mdl-card mdl-shadow--2dp home-cards",
        html: [$('<div/>', {
          "class": "mdl-card__title",
          css: {
            "color": "#fff",
            "background": "#3E4EB8"
          },
          html: $('<h2/>', {
            "class": "mdl-card__title-text",
            text: nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase()
          })
        }), $('<div/>', {
          "class": "mdl-tabs mdl-js-tabs mdl-js-ripple-effect",
          html: [$('<div/>', {
            "class": "mdl-tabs__tab-bar",
            html: [$('<a/>', {
              "class": "mdl-tabs__tab is-active reload-mc-masonry",
              "href": "#voti-materia-" + id,
              text: "Voti"
            }), $('<a/>', {
              "class": "mdl-tabs__tab reload-mc-masonry",
              "href": "#argomenti-materia-" + id,
              text: "Argomenti"
            }), $('<a/>', {
              "class": "mdl-tabs__tab reload-mc-masonry",
              "href": "#compiti-materia-" + id,
              text: "Compiti"
            })]
          }), $('<div/>', {
            "class": "mdl-tabs__panel is-active voti-materia",
            "id": "voti-materia-" + id
          }), $('<div/>', {
            "class": "mdl-tabs__panel argomenti-materia",
            "id": "argomenti-materia-" + id
          }), $('<div/>', {
            "class": "mdl-tabs__panel compiti-materia",
            "id": "compiti-materia-" + id
          })]
        })]
      })
    }).appendTo($("#materie-container"));
    componentHandler.upgradeDom();
  }
}

function fillAlunno() {
  var nav_loading = $("#nav-loading")[0];
  if(nav_loading.MaterialSpinner) nav_loading.MaterialSpinner.start();
  var assenze_ul = $("#assenze");
  var ritardi_ul = $("#ritardi");
  var uscite_ul = $("#uscite");
  var note_ul = $("#note");
  assenze_ul.empty();
  $("#assenze-loading").show();
  ritardi_ul.empty();
  $("#ritardi-loading").show();
  uscite_ul.empty();
  $("#uscite-loading").show();
  note_ul.empty();
  $("#note-loading").show();

  var i_assenze = 0, i_ritardi = 0, i_uscite = 0, i_note = 0;

  var assenze_fill_f = function (data) {
    var assenze = JSON.parse(data);
    var red_dot = '<div style="border-radius: 5px;background: #f00;width: 10px;height: 10px;display: inline-block;margin-left: 5px;"></div>';
    assenze.dati.forEach(function (element) {
      if (element.codEvento == "A") {
        i_assenze++;
        $('<div/>', {
          "class": "oggi-text",
          html: [$('<span/>', {
            "class": "materia",
            html: $.format.date(Date.parse(element.datAssenza), "dd/MM/yyyy") + ((element.datGiustificazione) ? "" : red_dot) + '.'
          }), $('<span/>', {
            "class": "info",
              html: 'Registrata da ' + toTitleCase(element.registrataDa).replace("(", "").replace(")", "")
          })]
        }).appendTo(assenze_ul);
      } else if (element.codEvento == "I") {
        i_ritardi++;
        $('<div/>', {
          "class": "oggi-text",
          html: [$('<span/>', {
            "class": "materia",
            text: $.format.date(Date.parse(element.datAssenza), "dd/MM/yyyy") //TODO: Da testare
          }), $('<span/>', {
            "class": "info",
              html: 'Ingresso in ' + element.numOra + '<sup>a</sup> ora registrata da ' + toTitleCase(element.registrataDa).replace("(", "").replace(")", "") + '.'
          })]
        }).appendTo(ritardi_ul);
      } else if (element.codEvento == "U") {
        i_uscite++;
        $('<div/>', {
          "class": "oggi-text",
          html: [$('<span/>', {
            "class": "materia",
            text: $.format.date(Date.parse(element.datAssenza), "dd/MM/yyyy")
          }), $('<span/>', {
            "class": "info",
              html: 'Uscita in ' + element.numOra + '<sup>a</sup> ora registrata da ' + toTitleCase(element.registrataDa).replace("(", "").replace(")", "") + '.'
          })]
        }).appendTo(uscite_ul);
      }
    });

    if (i_assenze == 0) {
      assenze_ul.append("<h6>Nessuna assenza.</h5>");
    }
    if (i_ritardi == 0) {
      ritardi_ul.append("<h6>Nessun ritardo.</h5>");
    }
    if (i_uscite == 0) {
      uscite_ul.append("<h6>Nessuna uscita.</h5>");
    }

    $("#assenze-loading").hide();
    $("#ritardi-loading").hide();
    $("#uscite-loading").hide();
  };

  var f_assenze = function () {
    var dfd = $.Deferred();
    request("assenze", { 'x-cod-min': codicescuola, 'x-auth-token': session.token, 'x-prg-alunno': alunno[0].prgAlunno, 'x-prg-scheda': alunno[0].prgScheda, 'x-prg-scuola': alunno[0].prgScuola }, {}, function () {
      assenze_fill_f(this.responseText);
      if (Storage) {
        localStorage.setItem("cache_assenze", this.responseText);
        localStorage.setItem("cache_assenze_date", $.format.date(new Date(), "HH:mm dd/MM/yyyy"));
      }
      dfd.resolve();
    }, function () {
      dfd.reject(1);
    }, function () {
      dfd.reject(2);
    });
    return dfd.promise();
  }

  var note_fill_f = function (data) {
    var note = JSON.parse(data);
    note.dati.forEach(function (element) {
      i_note++;
      $('<div/>', {
        "class": "oggi-text",
        html: [$('<span/>', {
          "class": "materia",
          text: $.format.date(Date.parse(element.datNota), "dd/MM/yyyy")
        }), $('<span/>', {
          "class": "info",
            html: element.desNota + '<br />' + toTitleCase(element.docente)
        })]
      }).appendTo(note_ul);
    });

    if (i_note == 0) {
      note_ul.append("<h6>Nessuna nota.</h5>");
    }

    $("#note-loading").hide();
  };

  var f_note = function () {
    var dfd = $.Deferred();
    request("notedisciplinari", { 'x-cod-min': codicescuola, 'x-auth-token': session.token, 'x-prg-alunno': alunno[0].prgAlunno, 'x-prg-scheda': alunno[0].prgScheda, 'x-prg-scuola': alunno[0].prgScuola }, {}, function () {
      note_fill_f(this.responseText);
      if (Storage) {
        localStorage.setItem("cache_note", this.responseText);
        localStorage.setItem("cache_note_date", $.format.date(new Date(), "HH:mm dd/MM/yyyy"));
      }
      dfd.resolve();
    }, function () {
      dfd.reject(1);
    }, function () {
      dfd.reject(2);
    });
    return dfd.promise();
  }

  f_assenze().then(f_note).then(function () {
    nav_loading.MaterialSpinner.stop();
  }).fail(function (e) {
    switch (e) {
      case 1:
        if (localStorage.getItem("cache_assenze_date")) {
          assenze_fill_f(localStorage.getItem("cache_assenze"));
          var date_cache = localStorage.getItem("cache_assenze_date");
        }
        if (localStorage.getItem("cache_note_date")) {
          note_fill_f(localStorage.getItem("cache_note"));
          var date_cache = localStorage.getItem("cache_note_date");
        }
        if (date_cache) {
          var notification = $('.mdl-js-snackbar')[0];
          notification.MaterialSnackbar.showSnackbar({
              message: 'Errore di rete. Ultimo aggiornamento: ' + date_cache,
              timeout: 4000
          });
          nav_loading.MaterialSpinner.stop();
        } else {
          var notification = $('.mdl-js-snackbar')[0];
          notification.MaterialSnackbar.showSnackbar({
              message: 'Errore di rete',
              timeout: 10000,
              actionHandler: function (event) {
                fillAlunno();
                notification.MaterialSnackbar.hideSnackbar();
              },
              actionText: 'Riprova'
          });

          $("#assenze-loading").hide();
          $("#ritardi-loading").hide();
          $("#uscite-loading").hide();
          $("#note-loading").hide();
          nav_loading.MaterialSpinner.stop();
          assenze_ul.append("<h6>Errore di rete.</h5>");
          ritardi_ul.append("<h6>Errore di rete.</h5>");
          uscite_ul.append("<h6>Errore di rete.</h5>");
          note_ul.append("<h6>Errore di rete.</h5>");
        }
        break;
      case 2:
        var notification = $('.mdl-js-snackbar')[0];
        notification.MaterialSnackbar.showSnackbar({
            message: 'Errore. Prova ad effettuare il lougut e a rientrare.',
            timeout: 10000,
            actionHandler: function (event) {
              logoutDialogElement.showModal();
              notification.MaterialSnackbar.hideSnackbar();
            },
            actionText: 'Logout'
        });

        $("#assenze-loading").hide();
        $("#ritardi-loading").hide();
        $("#uscite-loading").hide();
        $("#note-loading").hide();
        nav_loading.MaterialSpinner.stop();
        assenze_ul.append("<h6>Errore di rete.</h5>");
        ritardi_ul.append("<h6>Errore di rete.</h5>");
        uscite_ul.append("<h6>Errore di rete.</h5>");
        note_ul.append("<h6>Errore di rete.</h5>");
        break;
    }
    $(".materie-container").empty();
    nav_loading.MaterialSpinner.stop();
  });
}

function fillProfessori() {
  var professori_ul = $("#professori");
  professori_ul.empty();
  var professori_fill_f = function (data) {
    var professori = JSON.parse(data);
    var icon_html = '<i class="material-icons mdl-list__item-icon">person</i>';
    professori.forEach(function (element) {
      $('<li/>', {
        "class": "mdl-list__item mdl-list__item--two-line",
        html: $('<span/>', {
          "class": "mdl-list__item-primary-content",
          html: icon_html +' ' + toTitleCase(element.docente.nome) + ' ' + toTitleCase(element.docente.cognome) + '<span class="mdl-list__item-sub-title">' + parseMaterieName(element.materie) + '</span>'
        })
      }).appendTo(professori_ul);
    });
    $("#professori-loading").hide();
  };
  $("#professori-loading").show();
  request("docenticlasse", { 'x-cod-min': codicescuola, 'x-auth-token': session.token, 'x-prg-alunno': alunno[0].prgAlunno, 'x-prg-scheda': alunno[0].prgScheda, 'x-prg-scuola': alunno[0].prgScuola }, {}, function () {
    professori_fill_f(this.responseText);
    if (Storage) {
      localStorage.setItem("cache_professori", this.responseText);
      localStorage.setItem("cache_professori_date", $.format.date(new Date(), "HH:mm dd/MM/yyyy"));
    }
  }, function () {
    if (localStorage.getItem("cache_professori")) {
      professori_fill_f(localStorage.getItem("cache_professori"));
      var notification = $('.mdl-js-snackbar')[0];
      notification.MaterialSnackbar.showSnackbar({
          message: 'Errore di rete. Ultimo aggiornamento: ' + localStorage.getItem("cache_professori_date"),
          timeout: 4000
      });
    } else {
      $("#professori-loading").hide();
      professori_ul.append("<h6>Errore di rete.</h6>");
    }
  }, function () {
    $("#professori-loading").hide();
    professori_ul.append("<h6>Errore.</h6>");
  });
}

function colore_voto (voto) {
  if (voto >= 9) {
    return "green";
  } else if (voto >= 8 && voto < 9) {
    return "light-green";
  } else if (voto >= 7 && voto < 8) {
    return "lime";
  } else if (voto >= 6 && voto < 7) {
    return "amber";
  } else if (voto > 5 && voto < 6) {
    return "orange";
  } else if (voto >= 4 && voto <= 5) {
    return "deep-orange";
  } else if (voto < 4) {
    return "red";
  }
}

function fillMaterieFilter(filter){
  var def_start, def_end;
  switch (filter) {
    case '1quad':
      def_start = new Date(2018, 09, 01, 0, 0, 0, 0).getTime()/1000;
      def_end = new Date(2019, 01, 31, 0, 0, 0, 0).getTime()/1000;
      break;
    case '2quad':
      def_start = new Date(2019, 02, 01, 0, 0, 0, 0).getTime()/1000;
      def_end = new Date(2019, 06, 31, 0, 0, 0, 0).getTime()/1000;
      break;
    default:
      def_start = 0;
      def_end = 0;
  }
  //TODO
  var start = (localStorage.getItem('start_'+filter)) ? localStorage.getItem('start_'+filter): def_start;
  var end = (localStorage.getItem('end_'+filter)) ? localStorage.getItem('end_'+filter): def_end;
  fillMaterie(start, end);
}

function logout() {
  Cookies.remove('session');
  localStorage.clear();
  window.location.replace("login.html");
}

function settingsInit() {
  if (Cookies.get('view-source-hidden')) {
    $("#switch-view-source-hidden-label")[0].MaterialSwitch.on();
  }
}

function switchDiv(div) {
  switch (div) {
    case 'home':
      $("#home-div").show();
      $("#classe-div").hide();
      $("#materie-div").hide();
      $("#alunno-div").hide();
      $(".home-navigation").show();
      $("#select-filter").hide();
      $("#update").attr("onclick","fillOggi(current_date);");
      current_date = $.format.date(new Date(), "yyyy-MM-dd");
      fillOggi(current_date);
      break;
    case 'materie':
      $("#home-div").hide();
      $("#classe-div").hide();
      $("#alunno-div").hide();
      $("#materie-div").show();
      $(".home-navigation").hide();
      $("#select-filter").show();
      $("#update").show().attr("onclick","fillMaterie();");
      if(localStorage.getItem('def_filter')) fillMaterieFilter(localStorage.getItem('def_filter')); else fillMaterie();
      break;
    case 'alunno':
      $("#home-div").hide();
      $("#classe-div").hide();
      $("#materie-div").hide();
      $("#alunno-div").show();
      $(".home-navigation").hide();
      $("#select-filter").hide();
      $("#update").show().attr("onclick","fillAlunno();");
      fillAlunno();
      break;
    case 'classe':
      $("#home-div").hide();
      $("#classe-div").show();
      $("#materie-div").hide();
      $("#alunno-div").hide();
      $(".home-navigation").hide();
      $("#select-filter").hide();
      fillProfessori();
      break;
    default:
      console.log("Errore.");
  }
  if($(".mdl-layout__drawer").hasClass("is-visible")) $('.mdl-layout')[0].MaterialLayout.toggleDrawer();
}

$('#switch-view-source-hidden').click(function() {
  if (this.checked) {
    Cookies.set("view-source-hidden", true, { expires: 365 });
  } else {
    Cookies.remove("view-source-hidden");
  }
  $("#view-source").attr("hidden", this.checked);
});

var logoutDialogElement = $('#logoutDialog')[0];
if (!logoutDialogElement.showModal) {
  dialogPolyfill.registerDialog(logoutDialogElement);
}
$('#logoutDialog .close')[0].addEventListener('click', function() {
  logoutDialogElement.close();
});
$('#logoutDialog .yes')[0].addEventListener('click', function() {
  logoutDialogElement.close();
  logout();
});

var infoDialogElement = $('#infoDialog')[0];
if (!infoDialogElement.showModal) {
  dialogPolyfill.registerDialog(infoDialogElement);
}
$('#infoDialog .close')[0].addEventListener('click', function() {
  infoDialogElement.close();
});

var settingsDialogElement = $('#settingsDialog')[0];
if (!settingsDialogElement.showModal) {
  dialogPolyfill.registerDialog(settingsDialogElement);
}
$('#settingsDialog .close')[0].addEventListener('click', function() {
  settingsDialogElement.close();
});

var oggiDatepickerDialogElement = $('#dateDialog')[0];
if (!oggiDatepickerDialogElement.showModal) {
  dialogPolyfill.registerDialog(oggiDatepickerDialogElement);
}
