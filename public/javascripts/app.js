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
      $.ajax({
        url: '/api/1/statuses/update.json',
        type: 'POST',
        dataType: 'json',
        data: {
          suppress_response_codes: '1',
          status: $('#status').val()
        }
      })
      .done(function (data) {
        if (data.error == null) {
          alert(data);  // FIXME: Update view.
          $('#status').val('');
        } else {
          // FIXME: Alert gracefully.
          alert('Failed to tweet: ' + data.error);
        }
      })
      .fail(function (_jqXHR, textStatus, errorThrown) {
        // FIXME: Alert gracefully.
        alert('Failed to tweet: ' + textStatus + ' / ' + errorThrown);
      })
      .always(function (_jqXHR, _textStatus) {
        restoreRequestingStatus();
      });

      return false;
    });
  });
})(jQuery);

// __END__  {{{1
// vim: expandtab shiftwidth=2 softtabstop=2
// vim: foldmethod=marker
