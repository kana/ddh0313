(function ($, twttr) {
  $.fn.enable = function () {
    return this.removeAttr('disabled');
  };
  $.fn.disable = function () {
    return this.attr('disabled', 'disabled');
  };

  $(document).ready(function () {
    var popoverNormalOptions = [
      'animate',
      'delayIn',
      'delayOut',
      'fallback',
      'html',
      'live',
      'offset',
      'placement',
      'trigger'
    ];
    $('[data-popover]').each(function () {
      var $this = $(this);
      var options = {
        content: 'data-content',
        title: 'data-title'
      };
      $.each(popoverNormalOptions, function (_, v) {
        options[v] = $this.attr('data-' + v);
      });
      $this.popover(options);
    });
  });

  $(document).ready(function () {
    var twipsyNormalOptions = [
      'animate',
      'delayIn',
      'delayOut',
      'fallback',
      'html',
      'live',
      'offset',
      'placement',
      'trigger'
    ];
    $('[data-twipsy]').each(function () {
      var $this = $(this);
      var options = {
        title: 'data-title'
      };
      $.each(twipsyNormalOptions, function (_, v) {
        options[v] = $this.attr('data-' + v);
      });
      $this.twipsy(options);
    });
  });




  var callTwitterApi = function (url, method, data, done, fail, always) {
    $.ajax({
      url: url,
      type: method,
      dataType: 'json',
      data: $.extend({suppress_response_codes: '1'}, data),
    })
    .done(function (data) {
      if (data.error == null)
        done(data);
      else
        fail(data);
    })
    .fail(function (_jqXHR, textStatus, errorThrown) {
      fail({
        error: 'Failed to connect to Twitter (' +
               textStatus +
               ' / ' +
               errorThrown +
               ').'
      });
    })
    .always(function (_jqXHR, _textStatus) {
      always();
    });
  };

  var sinceIdTable = {
    '/api/1/statuses/user_timeline.json': '1'
  };
  var updateTimeline = function (apiUrl, columnId, additionalTweetClass) {
    var indicateRequestingStatus = function () {
      $('#' + columnId).twipsy('show');
    };
    var restoreRequestingStatus = function () {
      $('#' + columnId).twipsy('hide');
    };
    indicateRequestingStatus();
    callTwitterApi(
      apiUrl,
      'GET',
      {
        since_id: sinceIdTable[apiUrl],
        include_entities: 't',
        count: '20'
      },
      function (data) {
        var tweetTable = {};
        $.each(data, function (_, tweet) {
          tweetTable[tweet.id_str] = tweet;
        });
        var ids = $.map(data, function (tweet) {return tweet.id_str;});
        ids.sort();
        if (1 <= ids.length)
          sinceIdTable[apiUrl] = ids[ids.length - 1];
        $.each(ids, function (_, id) {
          var tweet = tweetTable[id];
          var d = {
            screenName: tweet.user.screen_name,
            text: twttr.txt.autoLink(
              tweet.text,
              {urlEntities: tweet.entities.urls}
            ),
            postedAt: tweet.created_at,
            id: tweet.id_str
          };
          $('#' + columnId + ' .tweets').prepend(
            $(
              $('#tweet-template').html().replace(
                /{{([^{}]+)}}/g,
                function (_, key) {
                  return d[key];
                }
              )
            )
            .addClass(additionalTweetClass)
            .find('a')
              .attr('target', '_blank')
            .end()
            .fadeIn()
          );
        });
      },
      function (data) {
        // FIXME: Alert gracefully.
        alert(data.error);
      },
      function () {
        restoreRequestingStatus();
      }
    );
  };
  var updateAllTimelines = (function () {
    var timer = null;
    return function () {
      if (timer)
        clearTimeout(timer);
      timer = setTimeout(updateAllTimelines, 5 * 60 * 1000);

      updateTimeline(
        '/api/1/statuses/user_timeline.json',
        'main-column',
        'mine'
      );
      updateTimeline(
        '/api/1/statuses/mentions.json',
        'mentions-column',
        'mention'
      );
    };
  })();

  $(document).ready(function () {
    $('#columns .tweets').empty();  // Remove dummy content.

    $('#not-signed-in #the-sign-in-menu').popover('show');
    $('#not-signed-in #tweet-form :input').disable();

    if ($('#signed-in').length) {
      $('#signed-in-user').hide();
      callTwitterApi(
        '/api/1/account/verify_credentials.json',
        'GET',
        {skip_status: 't'},
        function (user) {
          var $n = $('#signed-in-user').parent();
          $n.html(
            $n.html().replace(
              /{{([^{}]+)}}/g,
              function (_, key) {
                return user[key];
              }
            )
          );
        },
        function (data) {
          // FIXME: Alert gracefully.
          alert(data.error);
        },
        function () {
          $('#signed-in-user').fadeIn();
        }
      );

      updateAllTimelines();
    }

    var updateCharacterCount = function () {
      $('#character-count').text(140 - $(this).val().length);  // FIXME
    };
    $('#status')
      .keydown(updateCharacterCount)
      .keyup(updateCharacterCount);

    $('#tweet-form').submit(function () {
      if ($('#status').val() == '') {
        updateAllTimelines();
      } else {
        var indicateRequestingStatus = function () {
          $('#tweet-form :input').disable();
          $('#tweet-form #status').twipsy('show');
        };
        var restoreRequestingStatus = function () {
          $('#tweet-form :input').enable();
          $('#tweet-form #status').twipsy('hide');
        };

        indicateRequestingStatus();
        callTwitterApi(
          '/api/1/statuses/update.json',
          'POST',
          {
            suppress_response_codes: '1',
            status: $('#status').val()
          },
          function (data) {
            updateAllTimelines();  // To show the last posted tweet.
            $('#status').val('');
          },
          function (data) {
            // FIXME: Alert gracefully.
            alert(data.error);
          },
          function () {
            restoreRequestingStatus();
          }
        );
      }
      return false;
    });
  });
})(jQuery, twttr);

// __END__  {{{1
// vim: expandtab shiftwidth=2 softtabstop=2
// vim: foldmethod=marker
