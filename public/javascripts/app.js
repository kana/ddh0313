(function ($) {
  $.fn.enable = function () {
    return this.removeAttr('disabled');
  };
  $.fn.disable = function () {
    return this.attr('disabled', 'disabled');
  };
})(jQuery);

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




$(document).ready(function () {
  $('#columns .tweets').empty();  // Remove dummy content.

  $('.not-signed-in #the-sign-in-menu').popover('show');

  var updateCharacterCount = function () {
    $('#character-count').text(140 - $(this).val().length);  // FIXME
  };
  $('#status')
    .keydown(updateCharacterCount)
    .keyup(updateCharacterCount);

  $('.not-signed-in #tweet-form :input').disable();
  $('#tweet-form').submit(function () {
    var indicateRequestingStatus = function () {
      $('#tweet-form :input').disable();
      $('#tweet-form #status').twipsy({
        placement: 'below',
        trigger: 'manual'
      }).twipsy('show');
    };
    var restoreRequestingStatus = function () {
      $('#tweet-form :input').enable();
      $('#tweet-form #status').twipsy('hide');
    };
    indicateRequestingStatus();
    $.post(
      '/api/1/statuses/update.json',
      {
        status: $('#status').val()
      },
      'json'
    )
    .success(function (data) {
      if (data.error == null) {
        alert(data);  // FIXME: Update view.
        $('#status').val('');
      } else {
        // FIXME: Alert gracefully.
        alert('Failed to tweet: ' + data.error);
      }
    })
    .error(function (_jqXHR, textStatus, errorThrown) {
      // FIXME: Alert gracefully.
      alert('Failed to tweet: ' + textStatus + ' / ' + errorThrown);
    })
    .complete(function (_jqXHR, _textStatus) {
      restoreRequestingStatus();
    });

    return false;
  });
});

// __END__  {{{1
// vim: expandtab shiftwidth=2 softtabstop=2
// vim: foldmethod=marker
