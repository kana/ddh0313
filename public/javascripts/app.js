(function ($) {
  $.fn.enable = function () {
    return this.removeAttr('disabled');
  };
  $.fn.disable = function () {
    return this.attr('disabled', 'disabled');
  };
})(jQuery);

$(document).ready(function () {
  $('#columns .tweets').empty();  // Remove dummy content.

  $('.not-signed-in #the-sign-in-menu').popover({
    placement: 'below',
    trigger: 'manual'
  }).popover('show');

  var update_character_count = function () {
    $('#character-count').text(140 - $(this).val().length);  // FIXME
  };
  $('#status')
    .keydown(update_character_count)
    .keyup(update_character_count);

  $('.not-signed-in #tweet-form :input').disable();
  $('#tweet-form').submit(function () {
    var indicate_requesting_status = function () {
      $('#tweet-form :input').disable();
    };
    var restore_requesting_status = function () {
      $('#tweet-form :input').enable();
    };
    indicate_requesting_status();
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
      restore_requesting_status();
    });

    return false;
  });
});

// __END__  {{{1
// vim: expandtab shiftwidth=2 softtabstop=2
// vim: foldmethod=marker
