(function ($) {
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

  var mainTimelineSinceId = '1';
  var updateMainTimeline = function () {
    var indicateRequestingStatus = function () {
      $('#main-column').twipsy('show');
    };
    var restoreRequestingStatus = function () {
      $('#main-column').twipsy('hide');
    };
    indicateRequestingStatus();
    callTwitterApi(
      '/api/1/statuses/user_timeline.json',
      'GET',
      {
        since_id: mainTimelineSinceId,
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
          mainTimelineSinceId = ids[ids.length - 1];
        $.each(ids, function (_, id) {
          var tweet = tweetTable[id];
          var d = {
            screenName: tweet.user.screen_name,
            text: tweet.text,
            postedAt: tweet.created_at,
            id: tweet.id_str
          };
          $('#main-column .tweets').prepend(
            $(
              $('#tweet-template').html().replace(
                /{{([^{}]+)}}/g,
                function (_, key) {
                  return d[key];
                }
              )
            ).addClass('mine')
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

  $(document).ready(function () {
    $('#columns .tweets').empty();  // Remove dummy content.

    $('#not-signed-in #the-sign-in-menu').popover('show');
    $('#not-signed-in #tweet-form :input').disable();

    var updateCharacterCount = function () {
      $('#character-count').text(140 - $(this).val().length);  // FIXME
    };
    $('#status')
      .keydown(updateCharacterCount)
      .keyup(updateCharacterCount);

    $('#tweet-form').submit(function () {
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
          alert(data);  // FIXME: Update view.
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

      return false;
    });
  });
})(jQuery);

// __END__  {{{1
// vim: expandtab shiftwidth=2 softtabstop=2
// vim: foldmethod=marker
